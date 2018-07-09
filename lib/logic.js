/**
 * @param {org.example.mynetwork.Trade} trade
 * @transaction
 */
function tradeCommodity(trade) {
  this.totalValue = 0
  trade.commodity.forEach(function(commo){
    this.totalValue = this.totalValue + commo.value
  }, this)
  //validate the balance of the new owner
  if(trade.newOwner.balance < this.totalValue)
      throw new Error('Insufficient balance for new owner!');
  //validate that the current new owner is not the same as the old one
  if(trade.newOwner == trade.oldOwner)
      throw new Error('You can not make a transaction to yourself!');

  this.assets = []
  this.old_owner = null
  this.new_owner = null
  trade.commodity.forEach(function(commo){
    //validate the owners list of the asset
    if(commo.owners[0] != trade.oldOwner)
      throw new Error('This asset is not owned by this user!');
    if(commo.owners.length > 1)
      throw new Error('There are other owners for one of the assets!');
      
    //create a new owner of the asset
    var factory = getFactory()
    var newOwnerConcept = factory.newConcept('org.example.mynetwork', 'Owner')
    newOwnerConcept.trader = trade.newOwner
    newOwnerConcept.percentage = 100
    //update the owners array of the asset
    commo.owners.splice(0,1);
    commo.owners.push(newOwnerConcept)
    //add asset to the array that will be updated
    //update participants balance
    this.assets.push(commo)
    trade.oldOwner.balance = trade.oldOwner.balance + commo.value
    trade.newOwner.balance = trade.newOwner.balance - commo.value
    this.old_owner = trade.oldOwner
    this.new_owner = trade.newOwner
  });

  //actual update for the asset
  this.assets.forEach(function (asset){
    getAssetRegistry('org.example.mynetwork.Commodity')
      .then(function (assetRegistry){
          assetRegistry.update(asset);
    });
  })

  //update for participants
  getParticipantRegistry('org.example.mynetwork.Trader')
      .then(function (participantRegistry) {
          participantRegistry.update(this.old_owner);
          participantRegistry.update(this.new_owner);
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
          (tradePortion.commodity.value * tradePortion.percentage / 100)
      tradePortion.newOwner.balance = tradePortion.newOwner.balance -
          (tradePortion.commodity.value * tradePortion.percentage / 100)
      participantRegistry.update(tradePortion.oldOwner);
      participantRegistry.update(tradePortion.newOwner);
  });
}