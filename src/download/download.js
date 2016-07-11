/**
 * Created by gordon on 2014/11/3.
 */
angular.module('pzutil.download', []).
    factory('downloadHelper', ['$http','$q',
        function($http,$q){
            var service = { };
            service.downloadFile = function(httpPath,method,data) {
                var deferred = $q.defer();
                // Use an arraybuffer
                var params = { responseType: 'arraybuffer' };
                params.data = data;
                params.url = httpPath;
                params.method = method;
                params.headers = {
                    'no-stringify': true
                };
                $http(params)
                    .success( function(data, status, headers) {
                        var octetStreamMime = 'application/octet-stream';
                        var success = false;
                        // Get the headers
                        headers = headers();
                        // Get the filename from the x-filename header or default to "download.bin"
                        var filename = headers['x-filename'] || 'download.bin';
                        // Determine the content type from the header or default to "application/octet-stream"
                        var contentType = headers['content-type'] || octetStreamMime;
                        try
                        {
                            // Try using msSaveBlob if supported
                            console.log("Trying saveBlob method ...");
                            var blob = new Blob([data], { type: contentType });
                            if(navigator.msSaveBlob)
                                navigator.msSaveBlob(blob, filename);
                            else {
                                // Try using other saveBlob implementations, if available
                                var saveBlob = navigator.webkitSaveBlob || navigator.mozSaveBlob || navigator.saveBlob;
                                if(saveBlob){
                                    saveBlob(blob, filename);
                                    console.log("saveBlob succeeded");
                                    success = true;
                                    deferred.resolve(filename);
                                }
                            }
                        } catch(ex)
                        {
                            console.log("saveBlob method failed with the following exception:");
                            console.log(ex);
                        }

                        if(!success)
                        {
                            // Get the blob url creator
                            var urlCreator = window.URL || window.webkitURL || window.mozURL || window.msURL;
                            if(urlCreator)
                            {
                                // Try to use a download link
                                var link = document.createElement('a');
                                if('download' in link)
                                {
                                    // Try to simulate a click
                                    try
                                    {
                                        // Prepare a blob URL
                                        console.log("Trying download link method with simulated click ...");
                                        var blob = new Blob([data], { type: contentType });
                                        var url = urlCreator.createObjectURL(blob);
                                        link.setAttribute('href', url);

                                        // Set the download attribute (Supported in Chrome 14+ / Firefox 20+)
                                        link.setAttribute("download", filename);

                                        // Simulate clicking the download link
                                        var event = document.createEvent('MouseEvents');
                                        event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                                        link.dispatchEvent(event);
                                        console.log("Download link method with simulated click succeeded");
                                        success = true;
                                        deferred.resolve(filename);

                                    } catch(ex) {
                                        console.log("Download link method with simulated click failed with the following exception:");
                                        console.log(ex);
                                        deferred.reject( "Download link method with simulated click failed with the following exception:: " + ex);
                                    }
                                }

                            }
                        }
                    })
                    .error(function(data, status) {
                        console.log("Request failed with status: " + status);
                        console.log("Request failed with data: " , params.data);
                        deferred.reject( "Request failed with status: " + status);
                    });
                return deferred.promise;
            };
            return service;
        }])
