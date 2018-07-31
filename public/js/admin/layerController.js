app.controller('layerController', [
    '$scope',
    'Ape',
    '$http',
    function($scope, Ape, $http) {

        $scope.fileTarget = {};
        $scope.uploadFile = (cb) => {
            $scope.working = false;
            $scope.fileCB = cb;
            $scope.modal("file-upload");
        }



        $scope.help = {};
        $scope.search = "";

        $scope.$on('$routeChangeSuccess', function() {

            if ($scope.tutorial && $scope.tutorial.current != 0)
                pasync(window.nextTip)
        });

        $scope.itutorials = guides;

        $scope.getTutorial = () => {
            return $scope.tutorial;
        }

        window.getTutorial = $scope.getTutorial;

        $scope.startTutorial = (tutorial) => {

            window.location = tutorial.index;

            pasync(window.nextTip)

            $scope.tutorial = Object.assign({}, tutorial);
            $scope.modal("help-modal");
            swal("", "Tutorial has started, keep an eye out for popovers", "warning");
        }

        window.exitTutorial = () => {
            var index = $scope.tutorial.current;

            var prev = index != 0 ? index - 1 : 0;
            $(`[data-help="${prev}"]`).popover('destroy');

            $scope.tutorial = false;
            $scope.$apply();
        }

        window.nextTip = () => {

            if (!$scope.tutorial)
                return;

            var index = $scope.tutorial.current,
                length = $scope.tutorial.tips.length;

            if (index != 0) {
                var prev = index - 1;
                $(`[data-help="${prev}"]`).popover('destroy');
            }

            if (index == $scope.tutorial.tips.length) {
                var name = $scope.tutorial.name;
                swal("Success", `You completed the guide ${name}`, "success")

                $scope.tutorial = false;
                pasync(() => $scope.$apply());
                return;
            }



            var tip =
                $scope.tutorial.tips[index];

            var options = {
                placement: tip.placement ? tip.placement : "auto bottom",
                html: true,
                content: `<p>${tip.text}<br>${index + 1}/${length}</p><p><button class="btn btn-sm" type="button" onclick="exitTutorial()">Quit</button> <button type="button" style="display:${tip.hide ? 'none' : 'initial'}" class="btn btn-sm" onclick="nextTip()">Next</button></p>`,
                viewport: "body",
                title: tip.title,
                trigger: "manual"
            };

            var target = $(`[data-help="${index}"]`);

            if (target.length == 0) {
                window.exitTutorial();
                return;
            }

            target.popover(options);
            target.popover('show');

            $scope.tutorial.current++;

        }

        $scope.resourceNotFound = () => {
            swal("404", "specified resource was not found.", "warning");
        }


        $scope.sendMessage = () => {
            $scope.Do("POST", "help", $scope.help, (data) => {
                if (data)
                    swal("Success", "message sent!", "success");
            });
        }

        $scope.deleteAccount = () => {
            swal({
                    title: "Are you sure?",
                    text: "",
                    icon: "warning",
                    buttons: true,
                    dangerMode: true,
                })
                .then((willDelete) => {
                    if (willDelete) {
                        $http({
                            method: "GET",
                            url: "/api/delete_account",
                            headers: {},
                        }).then(function successCallback(response) {
                            window.location = "/";
                        }, function errorCallback(response) {
                            swal("Error", "Please try again", "error");
                        })
                    }
                });
        }

        $scope.updatePassword = () => {
            if (!$scope.password) {
                swal("", "Please fill out the form prior to submission.", "warning");
                return;
            }
            var password = sha256($scope.password.password).toUpperCase(),
                new_password = sha256($scope.password.new_password).toUpperCase();

            $http({
                method: "POST",
                data: { password, new_password },
                url: "/api/update_password",
                headers: {},
            }).then(function successCallback(response) {
                swal("Success", "Your password was updated!", "success");
                $scope.password = {};
            }, function errorCallback(response) {
                swal("Error", "Please verify the current password entered.", "error");
            })
        }

        window.LoadAlerts = () => {
            var ua = $(".user-alerts")
            ua.html("");

            if ($scope.toolbarAlerts.length == 0)
                ua.append("<p class='text-center'>No alerts at the moment.</p>");
            else {

                var alertTemplate = $("#alert-template");
                for (var i = $scope.toolbarAlerts.length - 1; i >= 0; i--) {
                    var alert = $scope.toolbarAlerts[i],
                        dv = alertTemplate.clone();

                    $("h5", dv).html(alert.name);

                    $(".description", dv).html(alert.description);

                    if (!alert.link) {
                        $("a.btn", dv).remove();
                    } else {
                        $("a.btn", dv).attr("href", alert.link);
                    }

                    dv.css('display', 'block');
                    dv.attr("data-id", alert._id);
                    ua.append(dv);



                }
            }
        }

        window.closeSearch = () => {
            $(".poptarget").popover('toggle');
        }

        $scope.getCache = () => {
            return $scope.dbCache;
        }
        $scope.buildCache = (type, noMatch, appType) => {

            $scope.Do("GET", type, {}, (data) => {
                if (!data) return;

                for (var o = 0; o < data.length; o++) {
                    var item = data[o];
                    item.resType = type;
                    item.appType = appType;
                    $scope.dbCache.push(item);
                }
                if (noMatch)
                    $scope.matchResults();
            });

        }

        $scope.findResults = () => {

            if (!$scope.dbCache) {
                $scope.newItemCache();
            } else {
                $scope.matchResults();
            }

        }

        $scope.newItemCache = (noMatch) => {
            $scope.dbCache = [];
            var resTypes = ["apis", "locations", "images", "events", "products"];
            var appTypes = { locations: "gm", images: "spl", events: "re", products: "cme" };

            for (var i = resTypes.length - 1; i >= 0; i--) {
                var type = resTypes[i];

                var appType = appTypes[type];

                $scope.buildCache(type, noMatch, appType);
            }
        }

        $scope.emptyCache = () => {
            $scope.dbCache = false;
        };

        $scope.matchResults = () => {
            var targ = $(".search-auto");


            $(".remove", targ).remove();
            var found = 0;
            var query = $scope.search.toLowerCase();
            for (var i = $scope.dbCache.length - 1; i >= 0; i--) {
                var item = $scope.dbCache[i];
                var selector = `[data-key="${item._id}"]`;

                if (item.name)
                    item.name = item.name.toLowerCase();
                else item.name = "";

                if ($(selector, targ).length == 0) {

                    if (item.name.includes(query)) {
                        item.type = item.resType == "apis" ? "websites" : item.resType;
                        targ.append(`<div data-key="${item._id}" style="height:40px;" class="list-group-item"><a href="#/${item.type}/${item._id}"><h5>${item.name} <small>${item.type}</small></h5></a></div>`);
                        found++;
                    }

                } else {

                    if (!item.name.includes(query)) {
                        $(selector, targ).remove();
                    } else found++;
                }
            }
            if (found == 0) {

                targ.append(`<p class="text-center remove">No results found for query <strong>${query}</strong> </p>`);
            }
        }

        $scope.getSearchText = () => {
            return $scope.search ? $scope.search : "";
        }

        $scope.resetSearch = () => {
            $scope.search = "";
        }

        $scope.showAutoComplete = () => {
            $(".poptarget").popover('show');
        }

        window.LoadUser = () => {
            //user-control
            var uc = $(".user-controls"),
                options = [
                    { name: "Account settings", modal: "account-modal" },
                    { name: "Update password", modal: "password-modal" }
                ];
            uc.html("");

            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                uc.append($(`<button onclick="modal('${option.modal}')" style="margin-top:10px;" class="btn btn-block btn-sm">${option.name}</button>`));
            }
            uc.append(`<button onclick="logout()" style="margin-top:10px;" class="btn btn-block">Logout</button>`)
        }

        window.clearAlerts = () => {
            $(".user-alerts").html("");
            for (var i = $scope.toolbarAlerts.length - 1; i >= 0; i--) {
                var alert = $scope.toolbarAlerts[i];
                $scope.Do("DELETE", `alerts/${alert._id}`, {}, (data) => {
                    $scope.toolbarAlerts = [];
                })
            }

        }

        $scope.deleteFile = (file, action) => {
            swal({
                    title: "Are you sure?",
                    text: "Once deleted, you will not be able to recover this resource.",
                    icon: "warning",
                    buttons: true,
                    dangerMode: true,
                })
                .then((willDelete) => {
                    if (willDelete) {
                        action(file);
                    }
                });

        }



        $scope.upload = () => {
            if (!selected_files || selected_files.length == 0) {
                swal({
                    title: "No files selected!",
                    icon: "warning"
                })
            }
            var counter = 0;
            for (var i = selected_files.length - 1; i >= 0; i--) {
                counter++;
                $scope.working = true;
                uploadFile(selected_files[i], (data) => {
                    $scope.fileCB(data)
                    counter--;
                    if (counter <= 0) {
                        $scope.modal("file-upload");
                    }
                });
            }
        }


        $scope.delete = (res, id) => {
            swal({
                    title: "Are you sure?",
                    text: "Once deleted, you will not be able to recover this resource.",
                    icon: "warning",
                    buttons: true,
                    dangerMode: true,
                })
                .then((willDelete) => {
                    if (willDelete) {

                        $scope.Do("DELETE", `${res}/${id}`, {}, (data) => {
                            if (data)
                                swal("Resource deleted.", {
                                    icon: "success",
                                }), $scope.emptyCache(), $scope.back();
                            else swal("Resource could not be removed, please try again.", {
                                icon: "error",
                            });
                        })
                    }
                });
        }

        $scope.update = (res, id, changes) => {

            $scope.emptyCache();
            $scope.Do("PUT", `${res}/${id}`, changes, (data) => {
                if (data)
                    swal("Resource updated.", {
                        icon: "success",
                    });
                else swal("Failed to save resource changes, please try again.", {
                    icon: "error",
                });
            })

        }

        $scope.modal = (id) => {

            $(`#${id}`).modal('toggle');
        }

        window.logout = () => {
            delete window.localStorage.token;
            window.location = "/login.html";
            return;
        }

        window.modal = $scope.modal;

        $scope.back = () => {
            window.history.back();
        }


        $scope.getToolbarAlerts = () => {
            $scope.Do("GET", "alerts", {}, (data) => {
                if (data)
                    $scope.toolbarAlerts = data;
            });
        }

        $scope.getPlanId = () => {
            return $scope.customer_id;
        }

        $scope.getUserApps = () => {
            $scope.Do("GET", "apps", {}, (data) => {
                $scope.ready = true;
                $scope.apps = data.apps;
                $scope.plan_id = data.plan_id;
                $scope.customer_id = data.customer_id;
                if ($scope.apps.length == 0) {
                    swal("Welcome", "It seems as if you have no apps installed. We will redirect you to pick which apps you'd like.", "success")
                    window.location = "#/apps";
                }
                BuildNav($scope.apps);
            })
        }

        $scope.planMaxs = {
            Essential: 3,
            Basic: 3,
            Professional: 7,
            Enterprise: 7
        }

        $scope.atMax = () => {
            if (!$scope.apps) return false;

            return $scope.apps.length >= $scope.planMaxs[$scope.plan_id];
        }


        if (!window.localStorage["token"]) {
            window.location = "/login.html";
        }


        $scope.initScope = () => {



            // initialize toolbar jquery plugins    
            var data = Object.assign({} ,window.localStorage);

            pasync(() => {
                $("a[data-placement].alerts").popover({});
                $("a[data-placement].account").popover({});
            });
            $scope.name = data.name;
            $scope.id = data.id;
            Ape.Init({
                base: "https://storehub.gophersauce.com/api/res/",
                headers: { token : data.token },
                start: () => {

                },
                end: (response, res) => {
                    if (response.error && !response.error.includes("app") && res.status == 401) {
                        if (!$scope.sessionExpired) {
                            $scope.sessionExpired = true;
                            alert("Your session expired, please login again.")
                        }
                      window.location = "/login.html";
                    }

                    if (response.error && response.error.includes("app") && res.status == 401) {
                        if (window.location.href.split("#")[1] != "/") {
                            swal("App not installed", "The app you are trying to use is not installed", "warning")
                            window.location = "#/apps";
                        }

                    }
                }
            });

            $scope.Do = Ape.Request;
            $scope.getToolbarAlerts();
            $scope.getUserApps();
            $scope.ready = true;
        }

        //CHECK FOR QUERIES
        var success = getUrlParameter("success"),
            error = getUrlParameter("error");

        if (success) {
            swal("Success", success, "success");
        }

        if (error) {
            swal("error", error, "error");
        }

        $scope.initScope();

    }
]);

window.pasync = (fn) => {
    setTimeout(fn, 800);
}


var selected_files;

function handleFiles(files) {
    selected_files = files;
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};


function randomString(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

    if (!length) {
        length = Math.floor(Math.random() * chars.length);
    }

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}



function serialize(obj, prefix) {
    var str = [],
        p;
    for (p in obj) {
        if (obj.hasOwnProperty(p)) {
            var k = prefix ? prefix + "[" + p + "]" : p,
                v = obj[p];
            str.push((v !== null && typeof v === "object") ?
                serialize(v, k) :
                encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
    }
    return str.join("&");
}

function uploadFile(file, cb) {
    var reader = new FileReader();
    var xhr = new XMLHttpRequest();
    var fd = new FormData();

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var success = (xhr.status == 200)
            try {
                cb(JSON.parse(xhr.responseText));
                if (window.getTutorial())
                    window.nextTip();
            } catch (e) {
                console.log(e);
                cb({ error: xhr.responseText == "" ? "Server wrote no response" : xhr.responseText })
            }

        }
    };
    xhr.open("POST", `/api/res/upload`, true);
    fd.append('file', file);
    // Initiate a multipart/form-data upload
    xhr.send(fd);
}