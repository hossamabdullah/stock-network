/**
 * @param {org.example.mynetwork.Trade} trade
 * @transaction
 */
function tradeCommodity(trade) {
  trade.commodity.forEach(function(commo){
    if(trade.newOwner.balance < commo.value)
      throw new Error('Insufficient balance');

    commo.owners.splice(0,1);
    
    var factory = getFactory()
    var newOwnerConcept = factory.newConcept('org.example.mynetwork', 'Owner')
    newOwnerConcept.trader = trade.newOwner
    newOwnerConcept.percentage = 100
    commo.owners.push(newOwnerConcept)


    getAssetRegistry('org.example.mynetwork.Commodity')
      .then(function (assetRegistry){
          assetRegistry.update(commo);
    });

    getParticipantRegistry('org.example.mynetwork.Trader')
      .then(function (participantRegistry) {
          trade.oldOwner.balance = trade.oldOwner.balance + commo.value
          trade.newOwner.balance = trade.newOwner.balance - commo.value
          participantRegistry.update(trade.oldOwner);
          participantRegistry.update(trade.newOwner);
    });

    
  });
}
  
/**
 * @param {org.example.mynetwork.TradePortion} tradePortion
 * @transaction
 */ 
function tradePortionOfAsset(tradePortion){
  owners = tradePortion.commodity.owners
  this.newOwnerIndex = -1;
  this.removeIndex = -1;
  
  owners.forEach(function(owner, index, arr){
    if(owner.trader== tradePortion.oldOwner){
      owner.percentage = owner.percentage - tradePortion.percentage
      if(owner.percentage == 0)
        this.removeIndex = index;
    }
    if(owner.trader == tradePortion.newOwner){
      this.newOwnerIndex = index;
    }
  }, this)

  if(this.newOwnerIndex == -1){
    var factory = getFactory()
    var newOwnerConcept = factory.newConcept('org.example.mynetwork', 'Owner')
    newOwnerConcept.trader = tradePortion.newOwner
    newOwnerConcept.percentage = tradePortion.percentage
    owners.push(newOwnerConcept)
  }else{
    owners[this.newOwnerIndex].percentage = tradePortion.percentage + owners[this.newOwnerIndex].percentage
  }

  if(this.removeIndex != -1){
    owners.splice(this.removeIndex, 1);
  }

  tradePortion.commodity.owners = owners

  getAssetRegistry('org.example.mynetwork.Commodity').then(function (assetRegistry){
      assetRegistry.update(tradePortion.commodity);
  });

  getParticipantRegistry('org.example.mynetwork.Trader').then(function (participantRegistry) {
      tradePortion.oldOwner.balance = tradePortion.oldOwner.balance + 
          (tradePortion.commodity.value * tradePortion / 100)
      tradePortion.newOwner.balance = tradePortion.newOwner.balance -
          (tradePortion.commodity.value * tradePortion / 100)
      participantRegistry.update(tradePortion.oldOwner);
      participantRegistry.update(tradePortion.newOwner);
  });
}