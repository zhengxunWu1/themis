# Themis backend

## campaign-manager

`npx ts-node index.ts` starts the campaign-manager server which manages campaign deployed and serve to frontend

## data-provider

`npx ts-node cronjob.ts` starts the cronjob that periodically fetch and process data from data sources,
and send to campaign-manager

TODOs:
- [ ] add more data provider to increase decentralization

## score-ea

`yarn start` starts external adapter that serves data through bridge from chainlink job, default listens on port 8080 

TODOs: 
- [ ] add multiple data sources and external adapters
- [ ] migrate to typescript if possible

## chainlink-node

`sudo dockerd` to start the docker daemon if it's not already running

`sudo service postgresql restart` to restart the postgre db if it's not already running

Follow the tutorial to [run a chainlink-node](https://docs.chain.link/docs/running-a-chainlink-node/)

Example of command to run the node locally after env setup:
`cd ~/.chainlink-kovan && docker run -p 6688:6688 -v ~/.chainlink-kovan:/chainlink -it --env-file=.env --network host smartcontract/chainlink:1.0.0 local n`

## keeper-registry
Run google-chrome locally `google-chrome --remote-debugging-port=9222 --user-data-dir="~/ChromeProfile"`, install metamask and setup your wallet that you want to use to be the admin for registering the keepers

It's an inner service used by campagin-manager

<del>TODOs</del>:
- [x] connect with typescript using either python-shell or server-client
- [x] figure out why transferAndCall on link doesn't work...
- [x] figure out why sometimes google-chrome crashs when start


## db
`sqlite3` to enter sqlite3 cli

Connect to the db `sqlite> .open ./backend/themis.db`