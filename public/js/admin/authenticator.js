app.controller('authenticator', [
    '$scope',
    'Ape',
    function($scope, Ape) {

        Ape.Init({
            base: "https://storehub.gophersauce.com",
            headers: {},
            start: () => {

            },
            end: () => {

            }
        })

        $scope.Do = (method, url, data, cb) => {
            Ape.Request(method, url, data, cb);
        }

        $scope.data = {};

        Ape.Request("GET", "/api/is_loggedin", {}, (data) => {
            if (data) {
                window.location = "/admin.html";
                return;
            }
        })

        // check for JWT token
        if (window.localStorage["token"]) {
            window.location = "/admin.html";
        }

        $scope.reset = () => {
            Ape.Request("POST",
                "/api/reset_password", {
                    email: $scope.data.email
                }, (data) => {
                    if (!data) {

                        swal({
                            title: "Error",
                            text: `Your email address does not exist on StoreHub.`,
                            icon: "error",
                            button: "Dismiss",
                        });

                    } else {

                        swal({
                            title: "Password changed!",
                            text: `Please check your email for a temporary password.`,
                            icon: "success",
                            button: "Dismiss",
                        });
                    }
                });
        }

        $scope.join = () => {
            Ape.Request("POST",
                "/api/join", {
                    email: $scope.data.email,
                    password: sha256($scope.data.password),
                    name: $scope.data.name,
                    plan_id: $scope.data.plan_id
                }, (data) => {

                    if (!data) {

                        swal({
                            title: "Error",
                            text: `Your email address is already in use`,
                            icon: "error",
                            button: "Dismiss",
                        });

                        return;
                    } else {
                        $scope.setCredentials(data);
                        window.location = "/admin.html";
                    }
                });
        }

        $scope.login = () => {
            Ape.Request("POST",
                "/api/login", {
                    email: $scope.data.email,
                    password: sha256($scope.data.password)
                }, (data) => {
                    if (!data) {

                        swal({
                            title: "Error",
                            text: `Invalid username/password combination`,
                            icon: "error",
                            button: "Dismiss",
                        });

                        return;
                    } else {
                        $scope.setCredentials(data);
                        window.location = "/admin.html";
                    }
                });
        }

        $scope.setCredentials = (data) => {
            window.localStorage["token"] = data.token;
            window.localStorage["name"] = data.name;
            window.localStorage["id"] = data.id;
        }

    }
]);