/**
 * import { Context, Signer } from "../_init.js";
 * import { NodeToast } from "../utils/NodeToast.js";
 * { polkadotUtil } = window
 */


// Register Blackprint Node
Blackprint.registerNode("Polkadot.js/Data/Sign",
class SignNode extends Blackprint.Node {
	// Input port
	static input = {
		Signer: Signer,
		Data: Blackprint.Port.Union([String, Uint8Array]),
	};

	// Output port
	static output = {
		Bytes: Uint8Array
	};

	constructor(instance){
		super(instance);

		let iface = this.setInterface(); // use empty interface
		iface.title = "Sign";
		iface.description = "Data/transaction signer";

		this._toast = new NodeToast(this.iface);

		// Manually call 'update' when any cable from input port was disconnected
		this.iface.on('cable.disconnect', Context.EventSlot, ({ port })=> {
			if(port.source === 'input') this.update();
		});
	}

	_fail(msg){
		this.output.Bytes = null; // Clear the output data if something was fail/error
		this._toast.warn(msg);
	}

	// This will be called by the engine if the input port have a new value
	async update(){
		let { Input, Output } = this.ref; // Shortcut

		if(!Input.Signer)
			return this._fail("Signer is required");

		let data = Input.Data;
		if(!data)
			return this._fail("Data is required");

		let { signer, address, isPair } = Input.Signer;
		this._toast.clear();

		// There's 2 source of signer (from Keypair and Browser Extension)

		if(isPair){ // Signer from Keypair (polkadotApi.Keyring)
			if(data.constructor === String)
				data = polkadotUtil.stringToU8a(data);

			// Sign with the keypair and put the data to the output port
			Output.Bytes = signer.sign(data);
		}
		else { // Signer from extension (polkadotExtensionDapp)
			if(data.constructor === Uint8Array)
				data = polkadotUtil.u8aToHex(data);
			else if(data.slice(0, 2) !== '0x')
				data = polkadotUtil.stringToHex(data);

			// Sign with the extension and get the Hex
			try{
				var temp = await signer.signRaw({
					type: 'bytes',
					data,
					address,
				});
			} catch(e) {
				this._fail(e.message);
				throw e;
			}

			// Convert the returned Hex to Uint8Array and put the data to the output port
			Output.Bytes = polkadotUtil.hexToU8a(temp.signature);
		}
	}
});