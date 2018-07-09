/**
 * @param {org.example.mynetwork.Trade} trade
 * @transaction
 */
function tradeCommodity(trade) {
  //validate the balance of the new owner
  this.totalValue = 0;
  trade.commodity.forEach(function(commo) {
    this.totalValue = this.totalValue + commo.value;
  }, this);
  if (trade.newOwner.balance < this.totalValue)
    throw new Error("Insufficient balance for new owner!");
  //validate that the current new owner is not the same as the old one
  if (trade.newOwner == trade.oldOwner)
    throw new Error("You can not make a transaction to yourself!");

  this.assets = [];
  this.old_owner = null;
  this.new_owner = null;
  trade.commodity.forEach(function(commo) {
    //validate the owners list of the asset
    if (commo.owners[0] != trade.oldOwner)
      throw new Error("This asset is not owned by this user!");
    if (commo.owners.length > 1)
      throw new Error("There are other owners for one of the assets!");

    //create a new owner of the asset
    var factory = getFactory();
    var newOwnerConcept = factory.newConcept("org.example.mynetwork", "Owner");
    newOwnerConcept.trader = trade.newOwner;
    newOwnerConcept.percentage = 100;
    //update the owners array of the asset
    commo.owners.splice(0, 1);
    commo.owners.push(newOwnerConcept);
    //add asset to the array that will be updated
    //update participants balance
    this.assets.push(commo);
    trade.oldOwner.balance = trade.oldOwner.balance + commo.value;
    trade.newOwner.balance = trade.newOwner.balance - commo.value;
    this.old_owner = trade.oldOwner;
    this.new_owner = trade.newOwner;
  });

  //actual update for the asset
  this.assets.forEach(function(asset) {
    getAssetRegistry("org.example.mynetwork.Commodity").then(function(
      assetRegistry
    ) {
      assetRegistry.update(asset);
    });
  });

  //update for participants
  getParticipantRegistry("org.example.mynetwork.Trader").then(function(
    participantRegistry
  ) {
    participantRegistry.update(this.old_owner);
    participantRegistry.update(this.new_owner);
  });
}

/**
 * @param {org.example.mynetwork.TradePortion} tradePortion
 * @transaction
 */

function tradePortionOfAsset(tradePortion) {
  //validate that the current new owner is not the same as the old one
  if (tradePortion.newOwner == tradePortion.oldOwner)
    throw new Error("You can not make a transaction to yourself!");

  //validate the new owner balance
  this.valueOfAsset =
    (tradePortion.commodity.value * tradePortion.percentage) / 100;
  if (tradePortion.newOwner.balance < this.valueOfAsset)
    throw new Error("Insufficient balance for new owner!");

  //initialize variables
  this.newOwnerIndex = -1;
  this.oldOwnerIndex = -1;
  this.removeOldOwner = false;
  this.oldOwnerPercentageNotEnough = false;

  //for owners array to change it then add the forked version after modifications
  owners = tradePortion.commodity.owners;
  //loop through owners
  owners.forEach(function(owner, index, arr) {
    if (owner.trader.traderId == tradePortion.oldOwner.traderId) {
      //update the old owner percentage
      owner.percentage = owner.percentage - tradePortion.percentage;
      //store old owner index, so we know if he doesn't exist
      this.oldOwnerIndex = index;
      //no more percentage for old owner, old owner will be removed
      if (owner.percentage == 0) this.removeOldOwner = true;
      //oldowner share less than required, we will throw error
      if (owner.percentage < 0) this.oldOwnerPercentageNotEnough = true;
    }

    if (owner.trader == tradePortion.newOwner) {
      //get index of new owner if exist
      this.newOwnerIndex = index;
    }
  }, this);

  //1 - dealing with old user
  //validate user is one of the owners of the asset
  if (this.oldOwnerIndex == -1)
    throw new Error("This asset is not owned by this user!");
  //validate user has enough share than the percentage to transfer
  if (this.oldOwnerPercentageNotEnough)
    throw new Error("This user does not have enough share of this asset!");

  //2 - dealing with new owner
  if (this.newOwnerIndex == -1) {
    //new owner doesn't have a previous share of the asset, will create a new entry for him
    var factory = getFactory();
    var newOwnerConcept = factory.newConcept("org.example.mynetwork", "Owner");
    newOwnerConcept.trader = tradePortion.newOwner;
    newOwnerConcept.percentage = tradePortion.percentage;
    owners.push(newOwnerConcept);
  } else {
    //new owner exist on the owners list of this asset, we will add the new percentage to him
    owners[this.newOwnerIndex].percentage =
      tradePortion.percentage + owners[this.newOwnerIndex].percentage;
  }

  //remove old owner as he has no more percentage, done in the end so we don't affect the indexes collected earlier
  if (this.removeOldOwner) owners.splice(this.oldOwnerIndex, 1);

  tradePortion.commodity.owners = owners;
  //make the update
  getAssetRegistry("org.example.mynetwork.Commodity").then(function(
    assetRegistry
  ) {
    assetRegistry.update(tradePortion.commodity);
  });
  getParticipantRegistry("org.example.mynetwork.Trader").then(function(
    participantRegistry
  ) {
    tradePortion.oldOwner.balance =
      tradePortion.oldOwner.balance + this.valueOfAsset;
    tradePortion.newOwner.balance =
      tradePortion.newOwner.balance - this.valueOfAsset;
    participantRegistry.update(tradePortion.oldOwner);
    participantRegistry.update(tradePortion.newOwner);
  },
  this);
}
