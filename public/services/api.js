angular.module('service.api', ['ngResource'])

.factory('APITicker', function ($resource) {
    return $resource('/api/ticker');
})

.factory('APIBalance', function ($resource) {
    return $resource('/api/balance');
})
.factory('APIOpenOrders', function ($resource) {
    return $resource('/api/openOrders');
})
.factory('APIClosedOrders', function ($resource) {
    return $resource('/api/closedOrders');
})
.factory('APIAddOrder', function ($resource) {
    return $resource('/api/addOrder');
})
.factory('APIWatcher', function ($resource) {
    return $resource('/api/watchers/:id');
});
