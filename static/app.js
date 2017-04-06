console.log("Running service worker");

self.addEventListener('paymentrequest', function(event) {
    console.log("PaymentRequest: " + JSON.stringify(event.data));
    event.respondWith(new Promise(function(resolve, reject) {
        self.addEventListener('message', function(event) {
            var response = event.data;
            console.log("PaymentResponse: " + JSON.stringify(response));
            if (response) {
                response.complete = function() {
                    console.log("PaymentResponse.complete()");
                    return Promise.resolve();
                }
                try {
                    resolve(response);
                } catch(error) {
                    console.log(error);
                    reject(error);
                }
            } else {
                reject();
            }
        });
        clients.openWindow("app.html").then(function(windowClient) {
            console.log("window opened!");
            windowClient.postMessage(event.data);
        })
        .catch(function(error) {
            console.log(error);
            reject(error);
        });
    }));
});

