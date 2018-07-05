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
  
/**
 * @param {org.example.mynetwork.TradePortion} tradePortion
 * @transaction
 */ 
function tradePortionOfAsset(tradePortion){
  owners = tradePortion.commodity.owners
  owners.forEach(function(owner, index, arr){
    if(owner.trader== tradePortion.oldOwner){
      owner.percentage = owner.percentage - tradePortion.percentage
      if(owner.percentage == 0)
        arr.splice(index, 1);
    }
  })
  
  var factory = getFactory()
  var newOwnerConcept = factory.newConcept('org.example.mynetwork', 'Owner')
  newOwnerConcept.trader = tradePortion.newOwner
  newOwnerConcept.percentage = tradePortion.percentage
  owners.push(newOwnerConcept)
  
  tradePortion.commodity.owners = owners

  getAssetRegistry('org.example.mynetwork.Commodity').then(function (assetRegistry){
      assetRegistry.update(tradePortion.commodity);
  });

  getParticipantRegistry('org.example.mynetwork.Trader').then(function (participantRegistry) {
      tradePortion.oldOwner.balance = tradePortion.oldOwner.balance + 
          (tradePortion.commodity.value * tradePortion / 100)
      tradePortion.newOwner.balance = tradePortion.newOwner.balance -
          (tradePortion.commodity.value * tradePortion / 100)
      participantRegistry.update(tradePortion.commodity.oldOwner);
      participantRegistry.update(tradePortion.commodity.newOwner);
  });
}