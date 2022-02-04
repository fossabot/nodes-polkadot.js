/**
 * import { Context } from "../_init.js";
 * import { NodeToast } from "../utils/NodeToast.js";
 * { polkadotUtil, polkadotApi } = window
 */

// This will be used for DecryptNode and EncryptNode
class CrypterNode extends Blackprint.Node {
	constructor(instance){
		super(instance);

		let iface = this.setInterface(); // use empty interface

		this._toast = new NodeToast(this.iface);

		// Manually call 'update' when any cable from input port was disconnected
		iface.on('cable.disconnect', Context.EventSlot, ({ port })=> {
			if(port.source === 'input') this.update();
		});
	}

	_fail(msg){
		this.output.Bytes = null; // Clear the output data if something was fail/error
		this._toast.warn(msg);
	}

	// This will be called by the engine if the input port have a new value
	update(){
		let { Input, Output } = this.ref; // Shortcut
		let toast = this._toast;

		if(!Input.Keyring)
			return this._fail("Keyring is required");

		if(!Input.Address)
			return this._fail("Address is required");

		if(!Input.Data)
			return this._fail("Data is required");

		// Try get the key pair for decrypting from Keyring
		try{
			var key = Input.Keyring.getPair(Input.Address);
		} catch(e) {
			// Clear any output and display the error message
			Output.Bytes = null;
			return toast.warn(e.message);
		}

		// Remove any node toast
		toast.clear();

		// If the Data is an string, let's convert it to Uint8Array
		let msg = Input.Data;
		if(msg.constructor === String)
			msg = polkadotUtil.stringToU8a(msg);

		return {keypair: key, message: msg};
	}
}


// Register Blackprint Node
Blackprint.registerNode("Polkadot.js/Keyring/Message/Decrypt",
class DecryptNode extends CrypterNode {
	// Input port
	static input = {
		Keyring: polkadotApi.Keyring,
		Address: String, // base58
		Data: Blackprint.Port.Union([String, Uint8Array]),
	};

	// Output port
	static output = {
		Bytes: Uint8Array
	};

	constructor(instance){
		super(instance);
		this.iface.title = "Decrypt Data";
	}

	// This will be called by the engine if the input port have a new value
	update(){
		let { Input, Output } = this.ref; // Shortcut
		let data = super.update();

		if(!data) return;
		let { keypair, message } = data;

		// Decrypt the message and put it on output port
		Output.Bytes = keypair.decryptMessage(message, void 0); // ToDo: try remove 'void 0'
	}
});