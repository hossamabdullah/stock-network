async function tradeCommodity(trade) {
  if(trade.newOwner.balance < trade.commodity.value)
    return;
  trade.commodity.owner.balance = trade.commodity.owner.balance + trade.commodity.value;
  let participantRegistry = await getParticipantRegistry('org.example.mynetwork.Trader');
  await participantRegistry.update(trade.commodity.owner);
  trade.newOwner.balance = trade.newOwner.balance - trade.commodity.value;
  trade.commodity.owner = trade.newOwner;
  let assetRegistry = await getAssetRegistry('org.example.mynetwork.Commodity');
  await assetRegistry.update(trade.commodity);
  await participantRegistry.update(trade.newOwner);
}
