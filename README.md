-1  - 
Delete old card if exist

```composer card delete -c admin@stock-network```

0 - 
Start the fabric

```./startFabric.sh```

1 - 
Generate the business network archive

```composer archive create -t dir -n .```

2 - 
Install the network

```composer network install --card PeerAdmin@hlfv1 --archiveFile stock-network@0.0.1.bna```

3 - 
Start the network

```composer network start --networkName stock-network --networkVersion 0.0.1 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card```

4 - 
Import new card that is created with step #3

```composer card import --file networkadmin.card```

5 - 
Ping the network using the card imported in step #4

```composer network ping --card admin@stock-network```

6 - 
Generate the rest server if you wish

```composer-rest-server -c admin@stock-network```

