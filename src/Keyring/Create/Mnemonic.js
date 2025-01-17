/**
 * { polkadotUtilCrypto } = window
 */


// Register Blackprint Node
Blackprint.registerNode("Polkadot.js/Keyring/Create/Mnemonic",
class RandomSeedNode extends Blackprint.Node {
	// Input port
	// static input = { Length: Blackprint.Port.Default(Number, 12) };

	// Output port
	static output = { Text: String };

	constructor(instance){
		super(instance);

		let iface = this.setInterface(); // use empty interface
		iface.title = "Create Mnemonic";
		iface.description = "Generate random mnemonic";
	}

	// This will be called by the engine once the node has been loaded
	imported(){
		// this.update();
		this.output.Text = polkadotUtilCrypto.mnemonicGenerate(12);
	}
});