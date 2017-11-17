(function () {
    angular.module('app')
    .directive('modalPanel', modalPanel);

    function modalPanel() {
        return {
            templateUrl: 'app/components/modal/modal-directive.html',
            restrict: 'E',
            transclude: true,
            scope: {
                title: '@',
                buttonTitle: '@',
                saveFunction: '=',
                closeFunction: '=',
                readOnly: '=',
                isDelete:'='
            }
        };
    }
})();
(function () {
    angular
        .module('app')
        .factory('authenticationService', authenticationService);

    authenticationService.$inject = ['$http', '$state', 'localStorageService', 'configService', '$q'];

    function authenticationService($http, $state, localStorageService, configService,$q) {        
        var service = {};
        service.login = login;
        service.logout = logout;
        return service;

        function login(user) {

            var defer = $q.defer();
            var url = configService.getApiUrl() + '/Token';            
            $http.post(url,user)
            .then(function (result) {                
                localStorageService.set('userToken',
                    {
                        token: result.data.access_Token,
                        userName: user.userName
                    });
                configService.setLogin(true);
                defer.resolve(true);
            },
            function (error) {
                defer.reject(false);
            });
            return defer.promise;
        }

        function logout() {            
            localStorageService.remove('userToken');
            configService.setLogin(false);            
        }

    }
})();
(function () {
    angular
        .module('app')
        .factory('dataService', dataService);

    dataService.$inject = ['$http'];

    function dataService($http) {
        var service = {};
        service.getData = getData;
        service.postData = postData;
        service.putData = putData;
        service.deleteData = deleteData;

        return service;

        function getData(url) {
            return $http.get(url);
        }
        function postData(url, data) {
            return $http.post(url, data);
        }
        function putData(url, data) {
            return $http.put(url, data);
        }
        function deleteData(url) {
            return $http.delete(url);
        }
    }
})();

(function () {
    'use strict';

    angular
        .module('app')
        .factory('configService', configService);

    configService.$inject = ['localStorageService'];

    function configService(localStorageService) {
        var service = {};
        var apiUrl = undefined;
        var isLogged = false;
        service.setLogin = setLogin;
        service.getLogin = getLogin;
        service.setApiUrl = setApiUrl;
        service.getApiUrl = getApiUrl;
        service.validate = validateLogin;

        return service;

        function setLogin(state) {
            isLogged = state;
        }

        function getLogin() {
            return isLogged;
        }

        function getApiUrl() {
            return apiUrl;
        }

        function setApiUrl(url) {
            apiUrl = url;
        }

        function validateLogin() {
            var user = localStorageService.get('userToken');
            if (user && user.token) {
                setLogin(true);
            }
            else {
                setLogin(false);
            }
            return isLogged; 
        }
    }
})();

(function () {
    'use strict';
    angular.module('app')
        .controller('customerController', customerController);

    customerController.$inject = ['dataService', 'configService', '$state', '$scope'];
    function customerController(dataService, configService, $state, $scope) {
        var apiUrl = configService.getApiUrl();
        var vm = this;

        //Propiedades
        vm.customer = {};
        vm.customerList = [];
        vm.modalButtonTitle = '';
        vm.readOnly = false;
        vm.isDelete = false;
        vm.modalTitle = '';
        vm.showCreate = false;
        vm.totalRecords = 0;
        vm.currentPage = 1;
        vm.maxSize = 10;
        vm.itemsPerPage = 30;

        //Funciones
        vm.getCustomer = getCustomer;
        vm.create = create;
        vm.edit = edit;
        vm.delete = customerDelete;
        vm.pageChanged = pageChanged;
        vm.closeModal = closeModal;
        init();

        function init() {
            if (!configService.getLogin()) return $state.go('login');
            configurePagination()
        }

        function configurePagination() {
            //In case mobile just show 5 pages
            var widthScreen = (window.innerWidth > 0) ? window.innerWidth : screen.width;

            if (widthScreen < 420) vm.maxSize = 5;

            totalRecords();
        }

        function pageChanged() {
            getPageRecords(vm.currentPage);
        }

        function totalRecords() {
            dataService.getData(apiUrl + '/customer/count')
                .then(function (result) {
                    vm.totalRecords = result.data;
                    getPageRecords(vm.currentPage);
                }
                , function (error) {
                    console.log(error);
                });
        }

        function getPageRecords(page) {
            dataService.getData(apiUrl + '/customer/list/' + page + '/' + vm.itemsPerPage)
                .then(function (result) {
                    vm.customerList = result.data;
                },
                function (error) {
                    vm.customerList = [];
                    console.log(error);
                });
        }

        function getCustomer(id) {
            vm.customer = null;
            dataService.getData(apiUrl + '/customer/' + id)
                .then(function (result) {
                    vm.customer = result.data;
                },
                function (error) {
                    vm.customer = null;
                    console.log(error);
                });
        }

        function updateCustomer() {
            if (!vm.customer) return;
            dataService.putData(apiUrl + '/customer', vm.customer)
                .then(function (result) {
                    vm.customer = {};
                    getPageRecords(vm.currentPage);
                    closeModal();
                },
                function (error) {
                    vm.customer = {};
                    console.log(error);
                });
        }

        function createCustomer() {
            if (!vm.customer) return;
            dataService.postData(apiUrl + '/customer', vm.customer)
                .then(function (result) {
                    getCustomer(result.data);
                    detail();
                    getPageRecords(1);
                    vm.currentPage = 1;
                    vm.showCreate = true;
                },
                function (error) {
                    console.log(error);
                    closeModal();
                });
        }

        function deleteCustomer() {
            dataService.deleteData(apiUrl + '/customer/' + vm.customer.id)
                .then(function (result) {
                    getPageRecords(vm.currentPage);
                    closeModal();
                },
                function (error) {
                    console.log(error);
                });
        }

        function create() {
            vm.customer = {};
            vm.modalTitle = 'Create Customer';
            vm.modalButtonTitle = 'Create';
            vm.readOnly = false;
            vm.modalFunction = createCustomer;
            vm.isDelete = false;
        }

        function edit() {
            vm.showCreate = false;
            vm.modalTitle = 'Edit Customer';
            vm.modalButtonTitle = 'Update';
            vm.readOnly = false;
            vm.modalFunction = updateCustomer;
            vm.isDelete = false;
        }

        function detail() {
            vm.modalTitle = 'The New Customer Created';
            vm.modalButtonTitle = '';
            vm.readOnly = true;
            vm.modalFunction = null;
            vm.isDelete = false;
        }

        function customerDelete() {
            vm.showCreate = false;
            vm.modalTitle = 'Delete Customer';
            vm.modalButtonTitle = 'Delete';
            vm.readOnly = false;
            vm.modalFunction = deleteCustomer;
            vm.isDelete = true;
        }

        function closeModal() {
            angular.element('#modal-container').modal('hide');
        }
    }
})();
(function () {
    'use strict';
    angular.module('app')
        .directive('customerCard', customerCard);

    function customerCard() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                id: '@',
                firstName: '@',
                lastName: '@',
                city: '@',
                country: '@',
                phone: '@'
            },
            templateUrl: 'app/private/customer/directives/customer-card/customer-card.html'

        };
    }
})();

(function () {
    'use strict';
    angular.module('app')
        .directive('customerForm', customerForm);
    function customerForm() {
        return {
            restrict: 'E',
            scope: {
                customer: '='
            },
            templateUrl: 'app/private/customer/directives/customer-form/customer-form.html'
        };
    }
})();
(function () {
    'use strict';
    angular.module('app')
        .controller('customerOrderController', customerOrderController);

    customerOrderController.$inject = ['$stateParams', '$state', 'dataService','configService'];

    function customerOrderController($stateParams, $state, dataService, configService) {

        //validation
        if ($stateParams.customerid === undefined || $stateParams.customerid === "" || $stateParams.customerid <= 0) {
            return $state.go("customer");
        }

        var vm = this;

        //properties
        vm.customerId = $stateParams.customerid;
        vm.customer = null;
        vm.orderList = [];

        init();

        function init() {
            getCustomer(vm.customerId);
        }

        function getCustomer(id) {
            vm.customer = null;
            dataService.getData(configService.getApiUrl() + '/customer/' + id)
                .then(function (result) {
                    vm.customer = result.data;
                    getOrderByCustomer(id);
                },
                function (error) {
                    vm.customer = null;                    
                    vm.orderList = [];
                    console.log(error);
                });
        }

        function getOrderByCustomer(id) {
            dataService.getData(configService.getApiUrl() + '/order/bycustomer/' + id)
                .then(function (result) {
                    vm.orderList = result.data;
                },
                function (error) {
                    vm.orderList = [];
                    console.log(error);
                });
        }
    }

})();
(function () {
    'use strict';
    angular.module('app')
        .controller('orderController', orderController);

    orderController.$inject = ['dataService', 'configService', '$state', '$scope'];
    function orderController(dataService, configService, $state, $scope) {
        var apiUrl = configService.getApiUrl();
        var vm = this;

        //Propiedades
        vm.order = {};
        vm.orderList = [];
        vm.modalButtonTitle = '';
        vm.readOnly = false;
        vm.isDelete = false;
        vm.modalTitle = '';
        vm.showCreate = false;
        vm.totalRecords = 0;
        vm.currentPage = 1;
        vm.maxSize = 10;
        vm.itemsPerPage = 30;

        //Funciones
        vm.getOrder = getOrder;
        vm.create = create;
        vm.edit = edit;
        vm.delete = orderDelete;
        vm.pageChanged = pageChanged;
        vm.closeModal = closeModal;
        init();

        function init() {
            if (!configService.getLogin()) return $state.go('login');
            configurePagination()
        }

        function configurePagination() {
            //In case mobile just show 5 pages
            var widthScreen = (window.innerWidth > 0) ? window.innerWidth : screen.width;

            if (widthScreen < 420) vm.maxSize = 5;

            totalRecords();
        }

        function pageChanged() {
            getPageRecords(vm.currentPage);
        }

        function totalRecords() {
            dataService.getData(apiUrl + '/order/count')
                .then(function (result) {
                    vm.totalRecords = result.data;
                    getPageRecords(vm.currentPage);
                }
                , function (error) {
                    console.log(error);
                });
        }

        function getPageRecords(page) {
            dataService.getData(apiUrl + '/order/list/' + page + '/' + vm.itemsPerPage)
                .then(function (result) {
                    vm.orderList = result.data;
                },
                function (error) {
                    vm.orderList = [];
                    console.log(error);
                });
        }

        function getOrder(id) {
            vm.order = null;
            dataService.getData(apiUrl + '/order/' + id)
                .then(function (result) {
                    vm.order = result.data;
                },
                function (error) {
                    vm.order = null;
                    console.log(error);
                });
        }

        function updateOrder() {
            if (!vm.order) return;
            dataService.putData(apiUrl + '/order', vm.order)
                .then(function (result) {
                    vm.order = {};
                    getPageRecords(vm.currentPage);
                    closeModal();
                },
                function (error) {
                    vm.order = {};
                    console.log(error);
                });
        }

        function createOrder() {
            if (!vm.order) return;
            dataService.postData(apiUrl + '/order', vm.order)
                .then(function (result) {
                    getOrder(result.data);
                    detail();
                    getPageRecords(1);
                    vm.currentPage = 1;
                    vm.showCreate = true;
                },
                function (error) {
                    console.log(error);
                    closeModal();
                });
        }

        function deleteOrder() {
            dataService.deleteData(apiUrl + '/order/' + vm.order.id)
                .then(function (result) {
                    getPageRecords(vm.currentPage);
                    closeModal();
                },
                function (error) {
                    console.log(error);
                });
        }

        function create() {
            vm.order = {};
            vm.modalTitle = 'Create Order';
            vm.modalButtonTitle = 'Create';
            vm.readOnly = false;
            vm.modalFunction = createOrder;
            vm.isDelete = false;
        }

        function edit() {
            vm.showCreate = false;
            vm.modalTitle = 'Edit Order';
            vm.modalButtonTitle = 'Update';
            vm.readOnly = false;
            vm.modalFunction = updateOrder;
            vm.isDelete = false;
        }

        function detail() {
            vm.modalTitle = 'The New Order Created';
            vm.modalButtonTitle = '';
            vm.readOnly = true;
            vm.modalFunction = null;
            vm.isDelete = false;
        }

        function orderDelete() {
            vm.showCreate = false;
            vm.modalTitle = 'Delete Order';
            vm.modalButtonTitle = 'Delete';
            vm.readOnly = false;
            vm.modalFunction = deleteOrder;
            vm.isDelete = true;
        }

        function closeModal() {
            angular.element('#modal-container').modal('hide');
        }
    }
})();
(function () {
    'use strict';
    angular.module('app')
        .directive('orderCard', orderCard);

    function orderCard() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                id: '@',
                orderDate: '@',
                orderNumber: '@',
                customerId: '@',
                totalAmount: '@'
            },
            templateUrl: 'app/private/order/directives/order-card/order-card.html'

        };
    }
})();

(function () {
    'use strict';
    angular.module('app')
        .directive('orderForm', orderForm);
    function orderForm() {
        return {
            restrict: 'E',
            scope: {
                order: '='
            },
            templateUrl: 'app/private/order/directives/order-form/order-form.html'
        };
    }
})();
(function () {
    'use strict';
    angular.module('app')
        .controller('orderItemController', orderItemController);

    orderItemController.$inject = ['dataService', 'configService', '$state', '$scope'];
    function orderItemController(dataService, configService, $state, $scope) {
        var apiUrl = configService.getApiUrl();
        var vm = this;

        //Propiedades
        vm.orderItem = {};
        vm.orderItemList = [];
        vm.modalButtonTitle = '';
        vm.readOnly = false;
        vm.isDelete = false;
        vm.modalTitle = '';
        vm.showCreate = false;
        vm.totalRecords = 0;
        vm.currentPage = 1;
        vm.maxSize = 10;
        vm.itemsPerPage = 30;

        //Funciones
        vm.getOrderItem = getOrderItem;
        vm.create = create;
        vm.edit = edit;
        vm.delete = orderItemDelete;
        vm.pageChanged = pageChanged;
        vm.closeModal = closeModal;
        init();

        function init() {
            if (!configService.getLogin()) return $state.go('login');
            configurePagination()
        }

        function configurePagination() {
            //In case mobile just show 5 pages
            var widthScreen = (window.innerWidth > 0) ? window.innerWidth : screen.width;

            if (widthScreen < 420) vm.maxSize = 5;

            totalRecords();
        }

        function pageChanged() {
            getPageRecords(vm.currentPage);
        }

        function totalRecords() {
            dataService.getData(apiUrl + '/orderItem/count')
                .then(function (result) {
                    vm.totalRecords = result.data;
                    getPageRecords(vm.currentPage);
                }
                , function (error) {
                    console.log(error);
                });
        }

        function getPageRecords(page) {
            dataService.getData(apiUrl + '/orderItem/list/' + page + '/' + vm.itemsPerPage)
                .then(function (result) {
                    vm.orderItemList = result.data;
                },
                function (error) {
                    vm.orderItemList = [];
                    console.log(error);
                });
        }

        function getOrderItem(id) {
            vm.orderItem = null;
            dataService.getData(apiUrl + '/orderItem/' + id)
                .then(function (result) {
                    vm.orderItem = result.data;
                },
                function (error) {
                    vm.orderItem = null;
                    console.log(error);
                });
        }

        function updateOrderItem() {
            if (!vm.orderItem) return;
            dataService.putData(apiUrl + '/orderItem', vm.orderItem)
                .then(function (result) {
                    vm.orderItem = {};
                    getPageRecords(vm.currentPage);
                    closeModal();
                },
                function (error) {
                    vm.orderItem = {};
                    console.log(error);
                });
        }

        function createOrderItem() {
            if (!vm.orderItem) return;
            dataService.postData(apiUrl + '/orderItem', vm.orderItem)
                .then(function (result) {
                    getOrderItem(result.data);
                    detail();
                    getPageRecords(1);
                    vm.currentPage = 1;
                    vm.showCreate = true;
                },
                function (error) {
                    console.log(error);
                    closeModal();
                });
        }

        function deleteOrderItem() {
            dataService.deleteData(apiUrl + '/orderItem/' + vm.orderItem.id)
                .then(function (result) {
                    getPageRecords(vm.currentPage);
                    closeModal();
                },
                function (error) {
                    console.log(error);
                });
        }

        function create() {
            vm.order = {};
            vm.modalTitle = 'Create Order-Item';
            vm.modalButtonTitle = 'Create';
            vm.readOnly = false;
            vm.modalFunction = createOrderItem;
            vm.isDelete = false;
        }

        function edit() {
            vm.showCreate = false;
            vm.modalTitle = 'Edit Order-Item';
            vm.modalButtonTitle = 'Update';
            vm.readOnly = false;
            vm.modalFunction = updateOrderItem;
            vm.isDelete = false;
        }

        function detail() {
            vm.modalTitle = 'The New Order-Item Created';
            vm.modalButtonTitle = '';
            vm.readOnly = true;
            vm.modalFunction = null;
            vm.isDelete = false;
        }

        function orderItemDelete() {
            vm.showCreate = false;
            vm.modalTitle = 'Delete Order-Item';
            vm.modalButtonTitle = 'Delete';
            vm.readOnly = false;
            vm.modalFunction = deleteOrderItem;
            vm.isDelete = true;
        }

        function closeModal() {
            angular.element('#modal-container').modal('hide');
        }
    }
})();
(function () {
    'use strict';
    angular.module('app')
        .directive('orderItemCard', orderItemCard);

    function orderItemCard() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                id: '@',
                orderId: '@',
                productId: '@',
                unitPrice: '@',
                quantity: '@'
            },
            templateUrl: 'app/private/order-item/directives/order-item-card/order-item-card.html'
        };
    }
})();

(function () {
    'use strict';
    angular.module('app')
        .directive('orderItemForm', orderItemForm);
    function orderItemForm() {
        return {
            restrict: 'E',
            scope: {
                orderItem: '='
            },
            templateUrl: 'app/private/order-item/directives/order-item-form/order-item-form.html'
        };
    }
})();
(function () {
     'use strict';
    angular.module('app')
        .controller('productController', productController);

    productController.$inject = ['dataService', 'configService', '$state', '$scope'];
    function productController(dataService, configService, $state, $scope) {
         var apiUrl = configService.getApiUrl();
         var vm = this;

         //Propiedades
         vm.product = {};
         vm.productList = [];
         vm.modalButtonTitle = '';
         vm.readOnly = false;
         vm.isDelete = false;
         vm.modalTitle = '';
         vm.showCreate = false;
         vm.totalRecords = 0;
         vm.currentPage = 1;
         vm.maxSize = 10;
         vm.itemsPerPage = 30;
         //Funciones
         vm.getProduct = getProduct;
         vm.create = create;
         vm.edit = edit;
         vm.delete = productDelete;
         vm.pageChanged = pageChanged;
         vm.closeModal = closeModal;
         init();

         function init() {
             if (!configService.getLogin()) return $state.go('login');
             configurePagination()
         }

         function configurePagination() {
             //In case mobile just show 5 pages
             var widthScreen = (window.innerWidth > 0) ? window.innerWidth : screen.width;

             if (widthScreen < 420) vm.maxSize = 5;

             totalRecords();
         }

         function pageChanged() {
             getPageRecords(vm.currentPage);
         }

         function totalRecords() {
             dataService.getData(apiUrl + '/product/count')
                 .then(function (result) {
                     vm.totalRecords = result.data;
                     getPageRecords(vm.currentPage);
                 }
                 , function (error) {
                     console.log(error);
                 });
         }

         function getPageRecords(page) {
             dataService.getData(apiUrl + '/product/list/' + page + '/' + vm.itemsPerPage)
                 .then(function (result) {
                     vm.productList = result.data;
                 },
                 function (error) {
                     vm.productList = [];
                     console.log(error);
                 });
         }

         function getProduct(id) {
             vm.product = null;
             dataService.getData(apiUrl + '/product/' + id)
                 .then(function (result) {
                     vm.product = result.data;
                 },
                 function (error) {
                     vm.product = null;
                     console.log(error);
                 });
         }

         function updateProduct() {
             if (!vm.product) return;
             dataService.putData(apiUrl + '/product', vm.product)
                 .then(function (result) {
                     vm.product = {};
                     getPageRecords(vm.currentPage);
                     closeModal();
                 },
                 function (error) {
                     vm.product = {};
                     console.log(error);
                 });
         }

         function createProduct() {
             if (!vm.product) return;
             dataService.postData(apiUrl + '/product', vm.product)
                 .then(function (result) {
                     getProduct(result.data);
                     detail();
                     getPageRecords(1);
                     vm.currentPage = 1;
                     vm.showCreate = true;
                 },
                 function (error) {
                     console.log(error);
                     closeModal();
                 });
         }

         function deleteProduct() {
             dataService.deleteData(apiUrl + '/product/' + vm.product.id)
             //dataService.deleteData(apiUrl + '/product', vm.product.id)
                 .then(function (result) {
                     getPageRecords(vm.currentPage);
                     closeModal();
                 },
                 function (error) {
                     console.log(error);
                 });
         }

         function create() {
             vm.product = {};
             vm.modalTitle = 'Create Product';
             vm.modalButtonTitle = 'Create';
             vm.readOnly = false;
             vm.modalFunction = createProduct;
             vm.isDelete = false;
         }

         function edit() {
             vm.showCreate = false;
             vm.modalTitle = 'Edit Product';
             vm.modalButtonTitle = 'Update';
             vm.readOnly = false;
             vm.modalFunction = updateProduct;
             vm.isDelete = false;
         }

         function detail() {
             vm.modalTitle = 'The New Product Created';
             vm.modalButtonTitle = '';
             vm.readOnly = true;
             vm.modalFunction = null;
             vm.isDelete = false;
         }

         function productDelete() {
             vm.showCreate = false;
             vm.modalTitle = 'Delete Product';
             vm.modalButtonTitle = 'Delete';
             vm.readOnly = false;
             vm.modalFunction = deleteProduct;
             vm.isDelete = true;
         }

         function closeModal() {
             angular.element('#modal-container').modal('hide');
         }
     }
})();
(function () {
    'use strict';
    angular.module('app')
        .directive('productCard', productCard);
    function productCard() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                id: '@',
                productName: '@',
                supplierId: '@',
                unitPrice: '@',
                package: '@',
                isDiscontinued: '='
            },
            templateUrl: 'app/private/product/directives/product-card/product-card.html'

        };
    }
})();

(function () {
    'use strict';
    angular.module('app')
        .directive('productForm', productForm);
    function productForm() {
        return {
            restrict: 'E',
            scope: {
                product: '='
            },
            templateUrl: 'app/private/product/directives/product-form/product-form.html'
        };
    }
})();
(function () {
    'use strict';
    angular.module('app')
        .controller('supplierController', supplierController);

    supplierController.$inject = ['dataService', 'configService', '$state', '$scope'];
    function supplierController(dataService, configService, $state, $scope) {
        var apiUrl = configService.getApiUrl();
        var vm = this;

        //Propiedades
        vm.supplier = {};
        vm.supplierList = [];
        vm.modalButtonTitle = '';
        vm.readOnly = false;
        vm.isDelete = false;
        vm.modalTitle = '';
        vm.showCreate = false;
        vm.totalRecords = 0;
        vm.currentPage = 1;
        vm.maxSize = 10;
        vm.itemsPerPage = 30;
        //Funciones
        vm.getSupplier = getSupplier;
        vm.create = create;
        vm.edit = edit;
        vm.delete = supplierDelete;
        vm.pageChanged = pageChanged;
        vm.closeModal = closeModal;
        init();

        function init() {
            if (!configService.getLogin()) return $state.go('login');
            configurePagination()
        }

        function configurePagination() {
            //In case mobile just show 5 pages
            var widthScreen = (window.innerWidth > 0) ? window.innerWidth : screen.width;

            if (widthScreen < 420) vm.maxSize = 5;

            totalRecords();
        }

        function pageChanged() {
            getPageRecords(vm.currentPage);
        }

        function totalRecords() {
            dataService.getData(apiUrl + '/supplier/count')
                .then(function (result) {
                    vm.totalRecords = result.data;
                    getPageRecords(vm.currentPage);
                }
                , function (error) {
                    console.log(error);
                });
        }

        function getPageRecords(page) {
            dataService.getData(apiUrl + '/supplier/list/' + page + '/' + vm.itemsPerPage)
                .then(function (result) {
                    vm.supplierList = result.data;
                },
                function (error) {
                    vm.supplierList = [];
                    console.log(error);
                });
        }

        function getSupplier(id) {
            vm.supplier = null;
            dataService.getData(apiUrl + '/supplier/' + id)
                .then(function (result) {
                    vm.supplier = result.data;
                },
                function (error) {
                    vm.supplier = null;
                    console.log(error);
                });
        }

        function updateSupplier() {
            if (!vm.supplier) return;
            dataService.putData(apiUrl + '/supplier', vm.supplier)
                .then(function (result) {
                    vm.supplier = {};
                    getPageRecords(vm.currentPage);
                    closeModal();
                },
                function (error) {
                    vm.supplier = {};
                    console.log(error);
                });
        }

        function createSupplier() {
            if (!vm.supplier) return;
            dataService.postData(apiUrl + '/supplier', vm.supplier)
                .then(function (result) {
                    getSupplier(result.data);
                    detail();
                    getPageRecords(1);
                    vm.currentPage = 1;
                    vm.showCreate = true;
                },
                function (error) {
                    console.log(error);
                    closeModal();
                });
        }

        function deleteSupplier() {
            dataService.deleteData(apiUrl + '/supplier/' + vm.supplier.id)
                .then(function (result) {
                    getPageRecords(vm.currentPage);
                    closeModal();
                },
                function (error) {
                    console.log(error);
                });
        }

        function create() {
            vm.supplier = {};
            vm.modalTitle = 'Create Supplier';
            vm.modalButtonTitle = 'Create';
            vm.readOnly = false;
            vm.modalFunction = createSupplier;
            vm.isDelete = false;
        }

        function edit() {
            vm.showCreate = false;
            vm.modalTitle = 'Edit Supplier';
            vm.modalButtonTitle = 'Update';
            vm.readOnly = false;
            vm.modalFunction = updateSupplier;
            vm.isDelete = false;
        }

        function detail() {
            vm.modalTitle = 'The New Supplier Created';
            vm.modalButtonTitle = '';
            vm.readOnly = true;
            vm.modalFunction = null;
            vm.isDelete = false;
        }

        function supplierDelete() {
            vm.showCreate = false;
            vm.modalTitle = 'Delete Supplier';
            vm.modalButtonTitle = 'Delete';
            vm.readOnly = false;
            vm.modalFunction = deleteSupplier;
            vm.isDelete = true;
        }

        function closeModal() {
            angular.element('#modal-container').modal('hide');
        }
    }
})();
(function () {
    'use strict';
    angular.module('app')
        .directive('supplierCard', supplierCard);
    function supplierCard() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                id: '@',
                companyName: '@',
                contactName: '@',
                contactTitle: '@',
                city: '@',
                country: '@',
                phone: '@',
                fax: '@',
            },
            templateUrl: 'app/private/supplier/directives/supplier-card/supplier-card.html'

        };
    }
})();

(function (undefined) {

    'use strict';

    angular.module('app').directive('supplierForm', supplierForm);

    function supplierForm() {
        return {
            restrict: 'E',
            scope: {
                supplier: '='
            },
            templateUrl: 'app/private/supplier/directives/supplier-form/supplier-form.html'
        };
    }

})();
(function () {
    'use strict';
    angular.module('app')
        .directive('supplierForm', supplierForm);
    function supplierForm() {
        return {
            restrict: 'E',
            scope: {
                supplier: '='
            },
            templateUrl: 'app/private/supplier/directives/supplier-form/supplier-form.html'
        };
    }
})();
(function () {
    'use strict';
    angular.module('app')
        .controller('userController', userController);

    userController.$inject = ['dataService', 'configService', '$state', '$scope'];
    function userController(dataService, configService, $state, $scope) {
        var apiUrl = configService.getApiUrl();
        var vm = this;

        //Propiedades
        vm.user = {};
        vm.userList = [];
        vm.modalButtonTitle = '';
        vm.readOnly = false;
        vm.isDelete = false;
        vm.modalTitle = '';
        vm.showCreate = false;
        vm.totalRecords = 0;
        vm.currentPage = 1;
        vm.maxSize = 10;
        vm.itemsPerPage = 30;
        //Funciones
        vm.getUser = getUser;
        vm.create = create;
        vm.edit = edit;
        vm.delete = userDelete;
        vm.pageChanged = pageChanged;
        vm.closeModal = closeModal;
        init();

        function init() {
            if (!configService.getLogin()) return $state.go('login');
            configurePagination()
        }

        function configurePagination() {
            //In case mobile just show 5 pages
            var widthScreen = (window.innerWidth > 0) ? window.innerWidth : screen.width;

            if (widthScreen < 420) vm.maxSize = 5;

            totalRecords();
        }

        function pageChanged() {
            getPageRecords(vm.currentPage);
        }

        function totalRecords() {
            dataService.getData(apiUrl + '/user/count')
                .then(function (result) {
                    vm.totalRecords = result.data;
                    getPageRecords(vm.currentPage);
                }
                , function (error) {
                    console.log(error);
                });
        }

        function getPageRecords(page) {
            dataService.getData(apiUrl + '/user/list/' + page + '/' + vm.itemsPerPage)
                .then(function (result) {
                    vm.userList = result.data;
                },
                function (error) {
                    vm.userList = [];
                    console.log(error);
                });
        }

        function getUser(id) {
            vm.user = null;
            dataService.getData(apiUrl + '/user/' + id)
                .then(function (result) {
                    vm.user = result.data;
                },
                function (error) {
                    vm.user = null;
                    console.log(error);
                });
        }

        function updateUser() {
            if (!vm.user) return;

            dataService.putData(apiUrl + '/user', vm.user)
                .then(function (result) {
                    vm.user = {};
                    getPageRecords(vm.currentPage);
                    closeModal();
                },
                function (error) {
                    vm.user = {};
                    console.log(error);
                });
        }

        function createUser() {
            if (!vm.user) return;
            dataService.postData(apiUrl + '/user', vm.user)
                .then(function (result) {
                    getUser(result.data);
                    detail();
                    getPageRecords(1);
                    vm.currentPage = 1;
                    vm.showCreate = true;
                },
                function (error) {
                    console.log(error);
                    closeModal();
                });
        }

        function deleteUser() {
            dataService.deleteData(apiUrl + '/user/' + vm.user.id)
                .then(function (result) {
                    getPageRecords(vm.currentPage);
                    closeModal();
                },
                function (error) {
                    console.log(error);
                });
        }

        function create() {
            vm.user = {};
            vm.modalTitle = 'Create User';
            vm.modalButtonTitle = 'Create';
            vm.readOnly = false;
            vm.modalFunction = createUser;
            vm.isDelete = false;
        }

        function edit() {
            vm.showCreate = false;
            vm.modalTitle = 'Edit User';
            vm.modalButtonTitle = 'Update';
            vm.readOnly = false;
            vm.modalFunction = updateUser;
            vm.isDelete = false;
        }

        function detail() {
            vm.modalTitle = 'The New User Created';
            vm.modalButtonTitle = '';
            vm.readOnly = true;
            vm.modalFunction = null;
            vm.isDelete = false;
        }

        function userDelete() {
            vm.showCreate = false;
            vm.modalTitle = 'Delete User';
            vm.modalButtonTitle = 'Delete';
            vm.readOnly = false;
            vm.modalFunction = deleteUser;
            vm.isDelete = true;
        }

        function closeModal() {
            angular.element('#modal-container').modal('hide');
        }
    }
})();
(function () {
    'use strict';
    angular.module('app')
        .directive('userCard', userCard);
    function userCard() {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                id: '@',
                email: '@',
                firstName: '@',
                lastName: '@',
                password: '@',
                roles: '@'
            },
            templateUrl: 'app/private/user/directives/user-card/user-card.html'
        };
    }
})();

(function () {
    'use strict';
    angular.module('app')
        .directive('userForm', userForm);
    function userForm() {
        return {
            restrict: 'E',
            scope: {
                user: '='
            },
            templateUrl: 'app/private/user/directives/user-form/user-form.html'
        };
    }
})();
(function () {
    'use strict';
    angular.module('app')
    .controller('loginController', loginController);

    loginController.$inject = ['$http', 'authenticationService', 'configService', '$state'];

    function loginController($http, authenticationService, configService, $state) {
        var vm = this;
        vm.user = {};
        vm.title = 'Login';
        vm.login = login;
        vm.showError = false;

        init();

        function init() {
            var element = angular.element('.modal-backdrop.fade.in');            
            if (element) element.remove();

            if (configService.getLogin()) $state.go("product");
            authenticationService.logout();
        }

        function login() {
            authenticationService.login(vm.user).then(function (result) {
                vm.showError = false;
                $state.go("home");
            }, function (error) {
                vm.showError = true;
            });               
        }
    }
})();