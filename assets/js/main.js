// Moralis infos
const serverUrl = "https://w22pulcstwkt.usemoralis.com:2053/server";
const appId = "0A7V0VE6xslIl7UADoFsfEU6arUaUegvjBoE2cqA"; // Don't know if it's secure to share it, no hak please :/
// Smart Contract infos
const contractAddress = "0xc526beD2f546e061c2B504FB86eE2c7885E0bb01";
const contractAbi = [{
		"inputs": [{
			"internalType": "string",
			"name": "_message",
			"type": "string"
		}],
		"name": "addListItem",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [{
			"internalType": "uint256",
			"name": "_index",
			"type": "uint256"
		}],
		"name": "removeListItem",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getList",
		"outputs": [{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			},
			{
				"internalType": "string[]",
				"name": "",
				"type": "string[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// Moralis Init
Moralis.start({
	serverUrl,
	appId
});

const user = Moralis.User.current();
var savedRequest = null; // Used for check the difference between old/new data for buildTodoList()

// Show/Hide elements if user is connected
if (user) {
    // Add <style> with .not-connected CSS class
	var style = document.createElement('style');
	style.innerHTML = ".not-connected{display: none !important;}";
	document.head.appendChild(style);

    // Add User ETH Address in the header
	document.querySelector("#header-address").textContent = "Connected with: " + user.get("ethAddress");
} else {
    // Add <style> with .connected CSS class
	var style = document.createElement('style');
	style.innerHTML = ".connected{display: none !important;}";
	document.head.appendChild(style);
}

// Authentification with Moralis
async function login() {
	if (!user) {
		user = await Moralis.authenticate({
				signingMessage: "Log in using Moralis"
			})
			.then(function(user) {
				location.reload();
			})
			.catch(function(error) {
				alert(JSON.stringify(error));
			});
	}
}
async function logOut() {
	await Moralis.User.logOut();
	location.reload();
}

document.getElementById("btn-login").onclick = login;
document.getElementById("btn-logout").onclick = logOut;

// Bind btn-addlist
document.querySelector("#btn-addlist").addEventListener("click", function() {
	addListItem();
});

// Check if user has MetaMask
async function checkWeb3() {
    if(!window.ethereum || !window.ethereum.on) {
        document.querySelector("#no-metamask").style.display = "block";
    }
}

// Build/Rebuild the To-Do List (front-end)
async function buildTodoList() {
	const options = {
		chain: "ropsten",
		address: contractAddress,
		function_name: "getList",
		abi: contractAbi
	};
	const request = await Moralis.Web3API.native.runContractFunction(options);

    // Check if new data is different than old data
	if (JSON.stringify(request) !== JSON.stringify(savedRequest)) {
		// Delete List items if they exists
		let listLength = document.querySelectorAll(".list li").length; // Important to save this data in variable (length will change with remove() elements)

		for (var i = 0; i < listLength; i++) {
			document.querySelectorAll(".list li")[0].remove(); // Indexes will change so it's better to always delete the first index
		}

        // Smart Contract function give us 2 arrays
		let addressList = request[0];
		let addressMessages = request[1];

		for (var i = 0; i < request[1].length; i++) {
            // Condition for skip empty array (when we delete a list item Ethereum never delete array index)
			if (request[1][i]) {
				// Create <li> list item
			    var newList = document.createElement("li");

				// Create <span> message
				var newListText = document.createElement("span");
				newListText.textContent = request[1][i];
				newList.appendChild(newListText);

				// Create <button> delete
				var newListDeleteBtn = document.createElement("button");
				newListDeleteBtn.textContent = "Delete";
				newListDeleteBtn.classList.add("connected");
				newListDeleteBtn.setAttribute("data-index", i);
                // bind <button> delete
				newListDeleteBtn.addEventListener("click", function(e) {
					removeListItem(e.target.getAttribute("data-index"));
				});
				newList.appendChild(newListDeleteBtn);

                // Add new list item in the DOM
				document.querySelector(".list").insertBefore(newList, document.querySelector("#insert-list-here"));
			}
		}

		// Save request response
		savedRequest = request;
		console.log("List build!")
	}
}

// Add an item on the list (blockchain)
async function addListItem() {
	const web3 = await Moralis.enableWeb3();
	const receipt = await Moralis.executeFunction({
		contractAddress: contractAddress,
		functionName: "addListItem",
		params: {
			_message: document.querySelector("#message").value,
		},
		abi: contractAbi
	});

	console.log(receipt);
	document.querySelector("#message").value = "";
	buildTodoList(); // Rebuild To-Do List
}

// Remove an item from the list (blockchain)
async function removeListItem(index) {
	const web3 = await Moralis.enableWeb3();
	const receipt = await Moralis.executeFunction({
		contractAddress: contractAddress,
		functionName: "removeListItem",
		params: {
			_index: index,
		},
		abi: contractAbi
	});

	console.log(receipt);
	buildTodoList(); // Rebuild To-Do List
}


// Refresh the to-do list every 30 seconds
setInterval(function() {
	buildTodoList();
}, 30000);


// It's bad but it's work so.. Need to wait Moralis API connector to load
setTimeout(function() {
	buildTodoList();
    checkWeb3();
}, 1000);