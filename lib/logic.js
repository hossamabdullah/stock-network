/**
 * @param {org.example.mynetwork.Trade} trade
 * @transaction
 */
function tradeCommodity(trade) {
  trade.commodity.forEach(function(commo){
  	if(trade.newOwner.balance < commo.value)
      throw new Error('Insufficient balance');

    commo.owner.balance = commo.owner.balance + commo.value;
    getParticipantRegistry('org.example.mynetwork.Trader')
      .then(function (participantRegistry) {
          participantRegistry.update(commo.owner);   
          trade.newOwner.balance = trade.newOwner.balance - commo.value;
          commo.owner = trade.newOwner;
          participantRegistry.update(trade.newOwner);	
    });

    getAssetRegistry('org.example.mynetwork.Commodity')
      .then(function (assetRegistry){
          assetRegistry.update(commo);
    });
  });
 
}
