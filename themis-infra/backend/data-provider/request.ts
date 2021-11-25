var axios = require('axios').default;
import { createConnection } from 'typeorm';
import { Schedule } from '../db/entity/schedule';
import { Campaign } from '../db/entity/campaign';
import { createConnectionToDB } from '../db/createConn';
// TODO: change createConnection to getConnection to reuse exisitng connection

if (!process.env.SPORTSDATAIO_API_KEY) {
  console.error('please set the api key!');
}
// to_do: add more data providers and match by date and name
let api_key = process.env.SPORTSDATAIO_API_KEY;

// in-memory cache for db, all gameId we have already created a campaign for
// TODO: should periodically flush to db
let gameIdDeployed = new Set();

/**
 * @param {string} date in format of xxxx-xx-xx, year-month-day
 */
export async function querySchedule(date: string) {
  var options = {
    method: 'GET',
    url: `https://api.sportsdata.io/v3/soccer/scores/json/GamesByDate/${date}?key=${api_key}`
  };
  // temp dict for this round of query result from gameId -> scheduleId
  let gameid2scheduleid = {};
  axios
    .request(options)
    .then(async (response) => {
      // write the schedule to db
      createConnection({
        type: 'sqlite',
        database: '../themis.db', // create a db in root of backend
        entities: [Schedule, Campaign],
        synchronize: true,
        logging: false
      }).then(async (conn) => {
        let scheduleRepository = conn.getRepository(Schedule);
        for (const schedule of response.data) {
          let newSchedule = new Schedule();
          // set data field, generate it
          // console.log(schedule["GameId"], typeof schedule["GameId"])
          newSchedule.GameId = schedule['GameId'];
          newSchedule.RoundId = schedule['RoundId'];
          newSchedule.Season = schedule['Season'];
          newSchedule.SeasonType = schedule['SeasonType'];
          newSchedule.Group = schedule['Group'];
          newSchedule.AwayTeamId = schedule['AwayTeamId'];
          newSchedule.HomeTeamId = schedule['HomeTeamId'];
          newSchedule.VenueId = schedule['VenueId'];
          newSchedule.Day = schedule['Day'];
          newSchedule.DateTime = schedule['DateTime'];
          newSchedule.Status = schedule['Status'];
          newSchedule.Week = schedule['Week'];
          newSchedule.Period = schedule['Period'];
          newSchedule.Clock = schedule['Clock'];
          newSchedule.Winner = schedule['Winner'];
          newSchedule.VenueType = schedule['VenueType'];
          newSchedule.AwayTeamKey = schedule['AwayTeamKey'];
          newSchedule.AwayTeamName = schedule['AwayTeamName'];
          newSchedule.AwayTeamCountryCode = schedule['AwayTeamCountryCode'];
          newSchedule.AwayTeamScore = schedule['AwayTeamScore'];
          newSchedule.AwayTeamScorePeriod1 = schedule['AwayTeamScorePeriod1'];
          newSchedule.AwayTeamScorePeriod2 = schedule['AwayTeamScorePeriod2'];
          newSchedule.AwayTeamScoreExtraTime =
            schedule['AwayTeamScoreExtraTime'];
          newSchedule.AwayTeamScorePenalty = schedule['AwayTeamScorePenalty'];
          newSchedule.HomeTeamKey = schedule['HomeTeamKey'];
          newSchedule.HomeTeamName = schedule['HomeTeamName'];
          newSchedule.HomeTeamCountryCode = schedule['HomeTeamCountryCode'];
          newSchedule.HomeTeamScore = schedule['HomeTeamScore'];
          newSchedule.HomeTeamScorePeriod1 = schedule['HomeTeamScorePeriod1'];
          newSchedule.HomeTeamScorePeriod2 = schedule['HomeTeamScorePeriod2'];
          newSchedule.HomeTeamScoreExtraTime =
            schedule['HomeTeamScoreExtraTime'];
          newSchedule.HomeTeamScorePenalty = schedule['HomeTeamScorePenalty'];
          newSchedule.HomeTeamMoneyLine = schedule['HomeTeamMoneyLine'];
          newSchedule.AwayTeamMoneyLine = schedule['AwayTeamMoneyLine'];
          newSchedule.DrawMoneyLine = schedule['DrawMoneyLine'];
          newSchedule.PointSpread = schedule['PointSpread'];
          newSchedule.HomeTeamPointSpreadPayout =
            schedule['HomeTeamPointSpreadPayout'];
          newSchedule.AwayTeamPointSpreadPayout =
            schedule['AwayTeamPointSpreadPayout'];
          newSchedule.OverUnder = schedule['OverUnder'];
          newSchedule.OverPayout = schedule['OverPayout'];
          newSchedule.UnderPayout = schedule['UnderPayout'];
          newSchedule.Attendance = schedule['Attendance'];
          newSchedule.Updated = schedule['Updated'];
          newSchedule.UpdatedUtc = schedule['UpdatedUtc'];
          newSchedule.GlobalGameId = schedule['GlobalGameId'];
          newSchedule.GlobalAwayTeamId = schedule['GlobalAwayTeamId'];
          newSchedule.GlobalHomeTeamId = schedule['GlobalHomeTeamId'];
          newSchedule.ClockExtra = schedule['ClockExtra'];
          newSchedule.ClockDisplay = schedule['ClockDisplay'];
          newSchedule.IsClosed = schedule['IsClosed'];
          newSchedule.HomeTeamFormation = schedule['HomeTeamFormation'];
          newSchedule.AwayTeamFormation = schedule['AwayTeamFormation'];
          newSchedule.PlayoffAggregateScore = schedule['PlayoffAggregateScore'];
          // save the new record
          await scheduleRepository.save(newSchedule);
          gameid2scheduleid[schedule['GameId']] =
            await scheduleRepository.findOne({
              where: { GameId: schedule['GameId'] },
              order: { Id: 'DESC' }
            });
          console.log(
            `saved a new schedule with gameId ${newSchedule.GameId} to db`
          );
        }
      });

      // start deploying valid schedule for this round of query
      for (const schedule of response.data) {
        if (validForDeploy(schedule)) {
          // make a post request to create a campaign
          axios
            .post('http://localhost:8090/createCampaign', {
              data: {
                oracleAddr: '0xC25d00698c4c48557B363F35AFe09d8f7907296c',
                gameId: schedule['GameId'],
                teamId0: schedule['HomeTeamId'],
                teamId1: schedule['AwayTeamId'],
                team0MoneyLine: schedule['HomeTeamMoneyLine'],
                team1MoneyLine: schedule['AwayTeamMoneyLine'],
                drawMoneyLine: schedule['DrawMoneyLine']
              }
            })
            .then((res) => {
              console.log(`statusCode: ${res.status}`);
              if (res.status == 200 && res.deployedAddr != null) {
                // write the deployed campaign to db for later use
                createConnectionToDB().then(async (conn) => {
                  let campaignRepository = conn.getRepository(Campaign);
                  let campaign = new Campaign();
                  campaign.DeployedAddress = res.deployedAddr;
                  campaign.GameId = schedule['GameId'];
                  campaign.KeeperAddress = null;
                  campaign.OracleAddress =
                    '0xC25d00698c4c48557B363F35AFe09d8f7907296c';
                  campaign.ScheduleId = gameid2scheduleid[schedule['GameId']];
                  await campaignRepository.save(campaign);
                  gameIdDeployed.add(campaign.GameId);
                  console.log(
                    `saved a new deployed campaign with gameId ${campaign.GameId} and deployed addr ${campaign.DeployedAddress} to db`
                  );
                });
              }
            })
            .catch((error) => {
              console.error(error);
            });
        }
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}

/**
 *
 * @param schedule the schedule we want to deploy a contract for
 * @returns whether schedule is valid for a campaign deployment
 */
function validForDeploy(schedule) {
  return (
    schedule['GameId'] != null &&
    !gameIdDeployed.has(schedule['GameId']) &&
    schedule['HomeTeamId'] != null &&
    schedule['AwayTeamId'] != null &&
    schedule['HomeTeamMoneyLine'] != null &&
    schedule['AwayTeamMoneyLine'] != null &&
    schedule['DrawMoneyLine'] != null
  );
}