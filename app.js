var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var path       = require('path');
var requestor  = require('./requestor');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

var port = 3001;
var jsonRequestor = requestor.getRequestor("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "https://pulsarfour03-alliance-prtnr-eu05-dw.demandware.net/s/Sites-SiteGenesisRomaTasks-Site/", "application/json");

app.get('/', function(req, res){
	jsonRequestor.makeRequest("POST", 'dw/shop/v16_4/customers/auth', function(body){
		jsonRequestor.makeRequest("POST", 'dw/shop/v16_4/baskets', function(body){
			res.sendFile(path.join(__dirname + '/index.html'));
		});
	}, {"type":"guest"});
});

app.get('/getProduct', function(req, res) {
	var query = req.query.query;
	jsonRequestor.makeRequest("GET", 'dw/shop/v16_4/product_search?q=' + query + '*&expand=images,prices,variations', function(body){
		var parsedBody = JSON.parse(body);
		var masterIDs = [];
		
		for (var i = 0; i < parsedBody.hits.length; i++) {
			masterIDs.push(parsedBody.hits[i].product_id);
		}

		getAllVariants(masterIDs, function(products) {
		    getAllVariantsInfo(products, function(info) {
		    	res.json(info);
		    });
		});
	});
});

function getAllVariants(references, callback){
	var length = 0, count = 0;
	var productsVariants = [];
	references.forEach(function(ref){
		length++;
		jsonRequestor.makeRequest("GET", 'dw/shop/v16_4/products/' + ref + '/variations', function(body){
			var parsedBody = JSON.parse(body);
			
			for (var j = 0; j < parsedBody.variants.length; j++) {
				productsVariants.push(parsedBody.variants[j].product_id);
			}

			if (++count === length) {
	          	callback(productsVariants);
	        }
		});
  	});
}

function getAllVariantsInfo(references, callback){
	var length = 0, count = 0;
	var productsVariantsInfo = [];
	references.forEach(function(ref){
		length++;

		jsonRequestor.makeRequest("GET", 'dw/shop/v16_4/products/' + ref + '?expand=availability,prices,images', function(body){
			var parsedBody = JSON.parse(body);
			if (parsedBody.inventory.orderable) {
				var productInfo = {
					id : parsedBody.id,
					name : parsedBody.name,
					color : parsedBody.c_color,
					size : parsedBody.c_size,
					imgLink : parsedBody.image_groups[1].images[0].link,
					price : parsedBody.price,
					count : parsedBody.inventory.ats
				};
				productsVariantsInfo.push(productInfo);
			}
			if (++count === length) {
	          	callback(productsVariantsInfo);
	        }
		});
  	});
}

app.post('/addItemToBasket', function(req, res) {
	var pid = req.body.pid;
	var qty = req.body.qty;

	jsonRequestor.makeRequest("POST", 'dw/shop/v16_4/baskets/' + jsonRequestor.getBasketID() + '/items', function(body){
		res.end(body);
	}, {"product_id" : pid, "quantity" : +qty});
});

app.get('/loadBasket', function(req, res) {
	jsonRequestor.makeRequest("GET", 'dw/shop/v16_4/baskets/' + jsonRequestor.getBasketID(), function(body){
		res.end("success");
	});
});

app.post('/setBasket', function(req, res) {
	var address = {
		"first_name" : "Roma",
		"last_name" : "Zhyhulskyi",
		"city" : "New York",
		"country_code" : "US",
		"c_strValue" : "cTest",
		"phone" : "333-333-3333",
		"address1" : "Henry St",
		"address2" : "Madison St",
		"postal_code" : "10010",
		"state_code" : "NY"
	};

	jsonRequestor.makeRequest("PUT", 'dw/shop/v16_4/baskets/' + jsonRequestor.getBasketID() + '/billing_address', function(body){
		jsonRequestor.makeRequest("PUT", 'dw/shop/v16_4/baskets/' + jsonRequestor.getBasketID() + '/customer', function(body){
			var shipment_id = "me";
			jsonRequestor.makeRequest("PUT", 'dw/shop/v16_4/baskets/' + jsonRequestor.getBasketID() + '/shipments/' + shipment_id + '/shipping_method', function(body){
				jsonRequestor.makeRequest("PUT", 'dw/shop/v16_4/baskets/' + jsonRequestor.getBasketID() + '/shipments/' + shipment_id + '/shipping_address', function(body){
					var parsedBody = JSON.parse(body);
					var responseData = {
						basket_id : parsedBody.basket_id,
						order_total : parsedBody.order_total
					};
					res.json(responseData);
				}, address);
			}, {"id" : "J220SM"});
		}, {"email" : "r.zhyhulskyi@pulsarfour.com"});
	}, address);
});

app.post('/placeOrder', function(req, res) {
	var amount = req.body.amount;
	jsonRequestor.makeRequest("POST", 'dw/shop/v16_4/baskets/' + jsonRequestor.getBasketID() + '/payment_instruments', function(body){
		jsonRequestor.makeRequest("POST", 'dw/shop/v16_4/orders', function(body){
			var order_no = JSON.parse(body).order_no;
			jsonRequestor.makeRequest("PATCH", 'dw/shop/v16_4/orders/' + order_no, function(body){
				res.end(body);
			}, {"payment_status" : "paid"});
		}, {"basket_id" : jsonRequestor.getBasketID()});
	}, {"payment_method_id" : "PayPal", "amount" : +amount});
});

app.delete('/deleteItemFromBasket', function(req, res) {
	var pid = req.body.pid;
	jsonRequestor.makeRequest("DELETE", 'dw/shop/v16_4/baskets/' + jsonRequestor.getBasketID() + '/items/' + pid, function(body){
		res.end(body);
	});
});

app.listen(port);
console.log('Listening port: ' + port);

module.exports = app;