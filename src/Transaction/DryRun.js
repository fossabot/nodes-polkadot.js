Blackprint.registerNode("Polkadot.js/Transaction/DryRun",
class TransferNode extends Blackprint.Node {
	static input = {
		Provider: Blackprint.Port.Union([polkadotApi.WsProvider, polkadotApi.HttpProvider]),
		Signer: Signer,
		Txn: Transaction,
	};

	static output = {
		Status: Object
	};

	constructor(instance){
		super(instance);

		let iface = this.setInterface(); // use empty interface
		iface.title = "Dry Run Transaction";
		iface.description = "Try a transaction but not actually execute it";
	}

	imported(){
		let {Input, Output, IInput, IOutput} = this.ref; // Shortcut
		let toast = new NodeToast(this.iface);

		function onStatus(ev){
			Output.Status = ev;
		}

		async function onChanged(){
			if(Input.Provider === null) return toast.warn("Provider is required");
			if(Input.Signer === null) return toast.warn("Signer is required");
			if(Input.Txn === null) return toast.warn("Txn is required");
			toast.clear();

			let ref = Input.Signer;
			let txn = Input.Txn.txn;

			try{
				if(ref.isPair)
					await txn.dryRun(ref.signer, onStatus);
				else await txn.dryRun(ref.address, {signer: ref.signer}, onStatus);
			} catch(e) {
				console.log(toast, e);
				toast.error(e.message);
				throw e;
			}
		}

		this.iface.on('port.value', Context.EventSlot, onChanged);
		this.iface.on('cable.disconnect', Context.EventSlot, function({ port }){
			if(port.source === 'input') onChanged();
		});
	}
});