angular.module('starter.controllers', [])

        .controller('DashCtrl', function ($scope, $timeout, $http) {

            var watchID;
            $scope.count = 0;
            $scope.list_coord = [];
            $scope.cod = {codigo: 2};
            var db = null;
            $scope.enable = true;
            var bgGeo = null;


            function openSqLite() {
                db = window.sqlitePlugin.openDatabase({name: "mylocations.db", androidDatabaseImplementation: 2});
                db.transaction(function (tx) {
                    tx.executeSql('CREATE TABLE IF NOT EXISTS latlong (lat, long, data, cod)');
                }, function (error) {
                    console.log('Transaction ERROR: ' + error.message);
                });
            }

            function insertCoordenadas(lat, long, timestamp, codigo) {
                openSqLite();
                db.transaction(function (tx) {
                    tx.executeSql('INSERT INTO latlong VALUES (?,?,?,?)', [lat, long, timestamp, codigo]);
                    //$scope.consultaCoordenadas(codigo, false);
                }, function (error) {
                    console.log('Transaction ERROR: ' + error.message);
                });
            }

            $scope.enviarDados = function (codigo) {
                var dados = [];
                openSqLite();
                var sql = 'Select * FROM latlong';
                if (codigo != 0) {
                    sql += " Where cod = " + codigo + "";
                }

                db.executeSql(sql, [], function (rs) {
                    for (var i = 0; i < rs.rows.length; i++) {
                        dados.push({lat: rs.rows.item(i).lat, long: rs.rows.item(i).long, data: rs.rows.item(i).data, cod: rs.rows.item(i).cod});
                    }

                    var config = {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
                        }
                    }

                    var url = "http://mydomain.com.br/webService/save";
                    var paramSerializado = dados;
                    $http({
                        method: 'POST',
                        url: url,
                        data: paramSerializado,
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    }).success(function (result) {
                        alert("Enviou");
                    });
                }, function (error) {
                    alert('SELECT SQL statement ERROR: ' + error.message);
                });
            }

            $scope.apagarDados = function (codigo) {
                var sql = 'DELETE FROM latlong';
                if (codigo != 0) {
                    sql += " Where cod = " + codigo + "";
                }
                db.executeSql(sql, [], function (rs) {
                    $timeout(function () {
                        $scope.list_coord = [];
                        alert('apagou');
                        $scope.consultaCoordenadas(codigo, true);
                    }, 500);
                }, function (error) {
                    alert('SELECT SQL statement ERROR: ' + error.message);
                });
            }

            $scope.consultaCoordenadas = function (codigo, message) {
                openSqLite();
                $scope.list_coord = [];

                var sql = 'Select * FROM latlong';
                if (codigo != 0) {
                    sql += " Where cod = " + codigo + "";
                }

                db.executeSql(sql, [], function (rs) {
                    $timeout(function () {
                        for (var i = 0; i < rs.rows.length; i++) {
                            $scope.list_coord.push({lat: rs.rows.item(i).lat, long: rs.rows.item(i).long, data: rs.rows.item(i).data, cod: rs.rows.item(i).cod});
                        }
                        if (message) {
                            alert("Finalizou");
                        }
                    }, 500);
                }, function (error) {
                    alert('SELECT SQL statement ERROR: ' + error.message);
                });
            }

            document.addEventListener("deviceready", onDeviceReady, false);

            ////
            // As with all Cordova plugins, you must configure within an #deviceready callback.
            //
            function onDeviceReady() {
                // Get a reference to the plugin.
                bgGeo = window.BackgroundGeolocation;

                //This callback will be executed every time a geolocation is recorded in the background.
                var callbackFn = function (location) {

                    console.log(location);
                    $scope.count++;
                    $timeout(function () {
                        var coords = location.coords;
                        var lat = coords.latitude;
                        var lng = coords.longitude;
                        insertCoordenadas(lat, lng, location.timestamp, parseInt($scope.cod.codigo));
                        //$scope.list_coord.push({lat: location.latitude, long: location.longitude, data: location.time, cod: $scope.cod.codigo});
                    }, 500);


                    //console.log('- Location: ', JSON.stringify(location));
                };

                // This callback will be executed if a location-error occurs.  Eg: this will be called if user disables location-services.
                var failureFn = function (errorCode) {
                    console.warn('- BackgroundGeoLocation error: ', errorCode);
                }

                // Listen to location events & errors.
                bgGeo.on('location', callbackFn, failureFn);
                // Fired whenever state changes from moving->stationary or vice-versa.
                bgGeo.on('motionchange', function (isMoving) {
                    console.log('- onMotionChange: ', isMoving);
                });
                // Fired whenever a geofence transition occurs.
                bgGeo.on('geofence', function (geofence) {
                    console.log('- onGeofence: ', geofence.identifier, geofence.location);
                });
                // Fired whenever an HTTP response is received from your server.
                bgGeo.on('http', function (response) {
                    console.log('http success: ', response.responseText);
                }, function (response) {
                    console.log('http failure: ', response.status);
                });

                // BackgroundGeoLocation is highly configurable.
                bgGeo.configure({
                    // Geolocation config
                    desiredAccuracy: 0,
                    distanceFilter: 10,
                    stationaryRadius: 25,
                    // Activity Recognition config
                    activityRecognitionInterval: 10000,
                    stopTimeout: 5,
                    // Application config
                    debug: false, // <-- Debug sounds & notifications.
                    stopOnTerminate: false,
                    startOnBoot: true,
                    // HTTP / SQLite config
                    /*url: "http://your.server.com/locations",
                     method: "POST",
                     autoSync: true,
                     maxDaysToPersist: 3,
                     headers: {// <-- Optional HTTP headers
                     "X-FOO": "bar"
                     },
                     params: {// <-- Optional HTTP params
                     "auth_token": "maybe_your_server_authenticates_via_token_YES?"
                     }*/
                }, function (state) {
                    // This callback is executed when the plugin is ready to use.
                    console.log("BackgroundGeolocation ready: ", state);
                    if (!state.enabled) {
                        //bgGeo.start();
                    }
                });

                // The plugin is typically toggled with some button on your UI.
                function onToggleEnabled(value) {
                    if (value) {
                        bgGeo.start();
                    } else {
                        bgGeo.stop();
                    }
                }
            }


            $scope.iniciarMonitoramento = function () {
                $scope.enable = false;
                bgGeo.start();

            }


            $scope.pararMonitoramento = function () {
                bgGeo.stop();
                $scope.enable = true;
                $scope.count = 0;
            }

        });



