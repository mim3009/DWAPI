(function () {
	loadBasket();
})();

function addToCart() {
	var data = {
		"pid" : $(this).closest(".productContent").attr("id"),
		"qty" : $(this).siblings(".productsQty").val()
	};

	$.ajax({
		type : "POST",
		url : "/addItemToBasket",
		data : data
	}).done(function(data) {
		var basketData = JSON.parse(data);
		updateCart(basketData);
		renderPayPalBtn(basketData);
	}).fail(function() {
		alert("Fail to get Basket");
	});
}

function deleteFromCart() {
	var data = {
		"pid" : $(this).closest(".productItemInBasket").attr("id")
	};

	$.ajax({
		type : "DELETE",
		url : "/deleteItemFromBasket",
		data : data
	}).done(function(data) {
		var basketData = JSON.parse(data);
		updateCart(basketData);
	}).fail(function() {
		alert("Fail to delete from Basket");
	});
}

function loadBasket() {
	$.ajax({
		type : "GET",
		url : "/loadBasket"
	}).done(function(data) {
		$.ajax({
			type : "POST",
			url : "/setBasket",
			data : data
		}).done(function(data) {
			var basketData = JSON.parse(data);
			$("#basket").append("<div id='basketHeader'><span>" + basketData.basket_id + "</span></div>");
			$("#basket").append("<div id='basketItems'></div>");
			$("#basket").append("<div id='basketTotal'>" + basketData.order_total + "</div>");
		}).fail(function() {
			alert("Fail to delete from Basket");
		});
	}).fail(function() {
		alert("Fail to get Basket");
	});
}

function updateCart(basketData) {
	$("#basketItems").html("");
	if (basketData.product_items) {
		for (var i = 0; i < basketData.product_items.length; i++) {
			$("#basketItems").append("<div class='productItemInBasket' id='" + basketData.product_items[i].item_id + "'><span>Product Name: " + basketData.product_items[i].product_name + "</span><br/><span>Product Price: " + basketData.product_items[i].price + "</span><br/><button class='deleteItemFromBasket'>Delete</button><div>");
		}
	}
	$(".deleteItemFromBasket").off('click').on('click', deleteFromCart);
	$("#basketTotal").html(basketData.order_total);
	if (basketData.order_total > 0) {
		renderPayPalBtn(basketData);
	}
	else {
		$("#paypal-button-container").remove();
	}
}

$("#getProduct").on("click", function(e){
	var data = {
		"query" : $("#query").val()
	};

	$.ajax({
		type : "GET",
		url : "/getProduct",
		data : data
	}).done(function(data) {
		for (var i = 0; i < data.length; i++) {
			$("#productInfo").append("<div class='productContent' id='" + data[i].id + "'></div>");
			$(".productContent:last").append("<span>Product Name: " + data[i].name + "</span><br/>");
			$(".productContent:last").append("<span>Product Color: " + data[i].color + "</span><br/>");
			$(".productContent:last").append("<span>Product Size: " + data[i].size + "</span><br/>");
			$(".productContent:last").append("<span>Product Price: " + data[i].price + "</span><br/>");
			$(".productContent:last").append("<span>Product Count: " + data[i].count + "</span><br/>");
			$(".productContent:last").append("<img src='" + data[i].imgLink + "'/><br/>");
			$(".productContent:last").append("qty: <input class='productsQty' type='number' min='1' max='" + data[i].count + "' value='1'/>");
			$(".productContent:last").append(" <button class='addToCart'>Add to Cart</button>");
			$(".addToCart:last").off('click').on('click', addToCart);
		}
	}).fail(function() {
		alert("Fail to get Product");
	});
});

function renderPayPalBtn(basketData) {
	$("#paypal-button-container").remove();
	$("#basket").append("<div id='paypal-button-container'></div>");
	paypal.Button.render({
	
        env: 'sandbox',

        client: {
            sandbox:    'ASEShkolv8BsV0ONvzkvd1krpnf_83RFgxsdeCcF-uZYGvipVqPEd6sYZBqXzoD5Y2qbekaCY14i-jAL',
            production: 'XXX'
        },

        payment: function() {
            var env = this.props.env;
            var client = this.props.client;

            return paypal.rest.payment.create(env, client, {
                transactions: [
                    {
                        amount: {
                            total: basketData.order_total,
                            currency: basketData.currency
                        },
                        item_list: {
                            shipping_address: {
                                recipient_name: basketData.shipments[0].shipping_address.full_name,
                                line1: basketData.shipments[0].shipping_address.address1,
                                line2: basketData.shipments[0].shipping_address.address2,
                                city: basketData.shipments[0].shipping_address.city,
                                country_code: basketData.shipments[0].shipping_address.country_code,
                                postal_code: basketData.shipments[0].shipping_address.postal_code,
                                phone:  basketData.shipments[0].shipping_address.phone,
                                state:  basketData.shipments[0].shipping_address.state_code
                            }
                        }
                    }
                ]
            });
        },

        onAuthorize: function(data, actions) {
    		return actions.payment.execute().then(function() {
        		data = {
        			"amount" : basketData.order_total
        		}
        		$.ajax({
					type : "POST",
					url : "/placeOrder",
					data : data
				}).done(function(data) {
					var orderData = JSON.parse(data);
					console.log(orderData);
					$("#basket").html("");
					alert("Thank you for purchase! Please come back, we always waiting for you!");
				}).fail(function() {
					alert("Fail to get Product");
				});
            });
        },
	}, '#paypal-button-container');
}