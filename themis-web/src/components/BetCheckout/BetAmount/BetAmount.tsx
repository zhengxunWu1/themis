import React from "react";
import { Grid, InputAdornment, TextField, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { BetCheckoutState } from "../../../interfaces/BetCheckoutState";
import { Match } from "../../../interfaces/Match";
import { TeamOdds, convertOddsToString } from "../../../interfaces/TeamOdds";
import { getTeamOdds } from '../../../redux/selectors/TeamOddsSelectors';
import { enterBid } from '../../../redux/actions/BetCheckoutActions';

interface BetAmountProps {
    match: Match;
    betCheckoutState: BetCheckoutState;
}

export function BetAmount (props: BetAmountProps) {
    const getWinnings = (amountParsed: number, odds: number): number => {
        if (odds < 0) {
            return -amountParsed/odds*100;
        } else {
            return amountParsed*odds/100;
        }
    }

    const renderAmountWinningsMessage = (teamOdds: TeamOdds | null, amountAsString: string) => {
        if (teamOdds === null) {
            return <Typography textAlign="center">Please pick a side.</Typography>
        }
        let amountParsed = parseFloat(amountAsString);
        if (isNaN(amountParsed)) {
            return <Typography textAlign="center">Please enter a decimal.</Typography>;
        } else if (amountParsed <= 0) {
            return <Typography textAlign="center">Only positive amounts please!</Typography>
        } else {
            let team = teamOdds.team.fullName == "Tie" ? "a tie" : teamOdds.team.fullName;
            let odds = convertOddsToString(teamOdds.odds);
            let winnings = getWinnings(amountParsed, teamOdds.odds);
            let message = `Since you bet on ${team} (${odds}), your winnings would be ${winnings} ETH.`;
            return <Typography textAlign="center">{message}</Typography>;
        }
    }
    return (
        <Box sx={{padding: 2}}>
            {
                props.betCheckoutState.bet.matchID === "" ?
                <Typography textAlign="center">Please go back and select a side.</Typography> :
                <Grid container>
                    <Grid xs={12} sx={{margin: 2}}>
                        <Typography textAlign="center">
                            Please enter the amount you would like to bet.
                        </Typography>
                    </Grid>
                    <Grid xs={12} textAlign="center" sx={{margin: 3}}>
                        <TextField
                            value={props.betCheckoutState.bet.bidAmount}
                            onChange={(event) => enterBid(event.target.value)}
                            label="Amount"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">ETH</InputAdornment>
                            }}
                        />
                    </Grid>
                    <Grid xs={12}>
                        {
                            props.betCheckoutState.bet.bidAmount !== "" 
                            && renderAmountWinningsMessage(
                                getTeamOdds(props.betCheckoutState, props.match),
                                props.betCheckoutState.bet.bidAmount
                            )
                        }
                    </Grid>
                </Grid>
            }
        </Box>
    );
}