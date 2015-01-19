var CONSTANTS = {
  API_BASE: 'http://localhost:3000/api/',
  EVENT_AUTH_FAIL: 'api::auth-fail',
  LOCALSTORAGE_TOKEN_KEY: 'AUTH_TOKEN'
};

function config($httpProvider, $stateProvider, $urlRouterProvider){
  $stateProvider
    .state('root', {
      abstract: true,
      templateUrl: 'partials/home.html',
      resolve: {
        auth: function authorizeState(apiService){
          return apiService.authCheck();
        }
      }
    })
    .state('root.home', {
      url: "/",
    })
    .state('login', {
      url: "/login",
      templateUrl: 'partials/login.html'
    })

  $urlRouterProvider.otherwise('/');

  $httpProvider.interceptors.push('httpAuthInterceptor');
}

function run($rootScope, $state, sessionService, CONSTANTS){
  var cachedToken = localStorage.getItem(CONSTANTS.LOCALSTORAGE_TOKEN_KEY);
  $rootScope.$on(CONSTANTS.EVENT_AUTH_FAIL, onAuthFail);

  if(cachedToken){
    sessionService.setAuthToken(cachedToken);
  }

  function onAuthFail(){
    $state.transitionTo('login')
  }
}

function apiService($http, $rootScope, CONSTANTS){
  var api = this;

  api.authCheck = authCheck;
  api.login = login;

  function authCheck(){
    var url = CONSTANTS.API_BASE + 'whoami';
    return $http.get(url).then(unwrapResponse, authFail)

    function authFail(error){
      $rootScope.$broadcast(CONSTANTS.EVENT_AUTH_FAIL);
    }
  }

  function login(viewmodel){
    var url = CONSTANTS.API_BASE + 'auth/login';
    viewmodel.client = 'web';
    return $http.post(url, viewmodel).then(unwrapResponse, apiFailure)
  }

  /* ====== UTIL ====== */

  function apiFailure(error){
    alert('API SERVICE ERROR');
  }

  function unwrapResponse(resp){
    return resp.data;
  }
}

function httpAuthInterceptor(sessionService){
  return {
        request: function($config) {
            if(sessionService.authToken){
              $config.headers['Authorization'] = 'Bearer: ' + sessionService.authToken;
            }
            return $config;
        }
    };
}

function sessionService(){
  var session = this;

  session.authToken = null;
  session.setAuthToken = setAuthToken;

  function setAuthToken(token){
    session.authToken = token;
    localStorage.setItem(CONSTANTS.LOCALSTORAGE_TOKEN_KEY, token);
  }
}

function loginCtrl($state, apiService, sessionService){
  var vm = this;

  vm.email = 'justinobney@gmail.com';
  vm.password = 'password';
  vm.submit = submit;

  function onLoginSuccess(resp){
    if(resp.success){
      sessionService.setAuthToken(resp.token);
      $state.transitionTo('root.home');
    }
  }

  function submit(){
    var viewmodel = _.pick(vm, ['email', 'password']);
    apiService.login(viewmodel).then(onLoginSuccess);
  }
}

angular
  .module('ng-auth-example', ['ui.bootstrap', 'ui.router'])
  .constant('CONSTANTS', CONSTANTS)
  .config(config)
  .factory('httpAuthInterceptor', httpAuthInterceptor)
  .service('apiService', apiService)
  .service('sessionService', sessionService)
  .controller('homeCtrl', homeCtrl)
  .controller('loginCtrl', loginCtrl)
  .run(run);