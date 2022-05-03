import "./Calendar.css"
import { ViewState, EditingState, IntegratedEditing } from '@devexpress/dx-react-scheduler';
import { Scheduler, WeekView, Appointments, AppointmentForm } from '@devexpress/dx-react-scheduler-material-ui';
import { Box, Button, Slider } from '@material-ui/core';
import Dialog from '@mui/material/Dialog';
import CircularProgress from '@mui/material/CircularProgress';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import abi from "./abis/Calend3.json";


// End admin section

const dateObj = new Date();
const month = dateObj.getUTCMonth() + 1; //months from 1-12
const day = dateObj.getUTCDate();
const tomorrow = dateObj.getUTCDate() + 1;
const year = dateObj.getUTCFullYear();
const test1StartDate = year + '-' + (month + '').padStart(2, '0') + '-' + ("" + day).padStart(2, '0') + 'T09:45';
const test1EndDate = year + '-' + (month + '').padStart(2, '0') + '-' + ("" + day).padStart(2, '0') + 'T10:45';

const test2StartDate = year + '-' + (month + '').padStart(2, '0') + '-' + ("" + tomorrow).padStart(2, '0') + 'T13:00';
const test2EndDate = year + '-' + (month + '').padStart(2, '0') + '-' + ("" + tomorrow).padStart(2, '0') + 'T14:45';
console.log('testStartDate', test1StartDate);


const schedulerData = [
    { startDate: test1StartDate, endDate: test1EndDate, title: 'Test Dogecoin Integration' },
    { startDate: test2StartDate, endDate: test2EndDate, title: 'Test Podcast Appearance' },
    // Example { startDate: '2022-05-02T12:00', endDate: '2022-05-02T13:30', title: 'Test Podcast Appearance' },
];


const contractAddress = "0xfBa631375A9bf08D049686374FC7Ba3281A3e823";
const contractABI = abi.abi;
const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = new ethers.Contract(contractAddress, contractABI, provider.getSigner());

console.log(contract);
console.log(`test appointments`, schedulerData);

// contract.on("LogNewAppointment", (appointment) => {
//     console.log(appointment);
// });
// console.log(contract.);
// contract.getRate().then((rate) => {
//     console.log('Rate', rate);
// });


const Calendar = ({account}) => {

    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [rate, setRate] = useState(-13);
    const [appointments, setAppointments] = useState(schedulerData);

    const [showDialog, setShowDialog] = useState(false);
    const [showSign, setShowSign] = useState(false);
    const [mined, setMined] = useState(false);
    const [transactionHash, setTransactionHash] = useState("");

    const getData = async () => {
        console.log(`getData`);
        const rate = await contract.getRate();
        console.log(`rate`, rate.toString());
        setRate(ethers.utils.formatEther(rate.toString()));
        console.log('useEffect');
        const owner = await contract.owner();
        console.log(`account`, account.toUpperCase());
        setIsAdmin(("" + owner).toUpperCase() === ("" + account).toUpperCase());
        console.log(`owner`, owner);
        const appointments = await contract.getAppointments();
        const convertedAppointments = transformAppointmentData(appointments)
        setAppointments(convertedAppointments);
        console.log(`appointments`, convertedAppointments);
    }

    const transformAppointmentData = (appointments) => {
        console.log(`transformAppointmentData`, appointments);
        return appointments.map((appointment) => {
            return {
                startDate: new Date(appointment.startDate * 1000),
                endDate: new Date(appointment.endDate),
                title: appointment.title,
            }
        });
    }

    useEffect( () => {
        getData();
    }, []);

    // input.
    // {
    //         "added": {
    //         "title": "test appointment",
    //             "startDate": "2022-02-08T18:00:00.000Z",
    //             "endDate": "2022-02-08T18:30:00.000Z",
    //             "allDay": false,
    //             "notes": "some notes"
    //     }
    // }
    const saveAppointment = async (data) => {
        console.log(`input data for saving appointment`, data);
        const appointment = data.added;
        const schedularMeeting = {...appointment, startDate: appointment.startDate.getTime() / 1000, endDate: appointment.endDate.getTime() / 1000};
        const cost = (schedularMeeting.endDate / 60) - (schedularMeeting.startDate / 60) * rate;
        schedularMeeting.notes = (schedularMeeting.notes)? schedularMeeting.notes + `\nCost: ${cost}`: `Cost: ${cost}`;
        console.log(`schedularMeeting`, schedularMeeting);

        setShowSign(true);
        setShowDialog(true);
        setMined(false);

        try {
            const msg = {value: ethers.utils.parseEther(cost.toString())};
            let transaction = await contract.createAppointment(schedularMeeting.title, schedularMeeting.startDate, schedularMeeting.endDate, schedularMeeting.notes, cost);

            setShowSign(false);

            await transaction.wait();

            setMined(true);
            setTransactionHash(transaction.hash);
        } catch (error) {
            console.log(error);
        }

        // try {
        //     const tx = await contract.createAppointment(schedularMeeting.title, schedularMeeting.startDate, schedularMeeting.endDate, schedularMeeting.notes, cost);
        //     tx.wait();
        // } catch (error) {
        //     console.log(error);
        // }

        const currentAppointments  = [... appointments];
        currentAppointments.push(data.added);
        setAppointments(currentAppointments);
        console.log(currentAppointments);
    }

    // const saveAppointment = async (data) => {
    //     const appointment = data.added;
    //     const title = appointment.title;
    //     const startTime = appointment.startDate.getTime() / 1000;
    //     const endTime = appointment.endDate.getTime() / 1000;
    //
    //     try {
    //         const cost = ((endTime - startTime) / 60) * rate;
    //         const msg = {value: ethers.utils.parseEther(cost.toString())};
    //         let transaction = await contract.createAppointment(title, startTime, endTime, msg);
    //
    //         await transaction.wait();
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }


// Begin admin section
    const marks = [
        {
            value: 0.00,
            label: 'Free',
        },
        {
            value: 0.02,
            label: '0.02 ETH/min',
        },
        {
            value: 0.04,
            label: '0.04 ETH/min',
        },
        {
            value: 0.06,
            label: '0.06 ETH/min',
        },
        {
            value: 0.08,
            label: '0.08 ETH/min',
        },
        {
            value: 0.1,
            label: 'Expensive',
        },
    ];

    const handleSliderChange = (event, newValue) => {
        console.log(`handling change of rate`, newValue);
        setRate(newValue);

    };

    const saveRate = async (event, newValue) => {
        console.log(`saveRate to blockchain`, newValue);

        const currentRate = await contract.getRate();
        console.log(`currentRate on chain`, currentRate.toString());

        console.log(`sliderRate`,  ethers.utils.formatEther(rate.toString()));
        const sliderInEth = ethers.utils.parseEther(rate.toString());
        console.log(`sliderInEth`, sliderInEth);

        // TODO IDSME check return var
        const newRate = await contract.setRate(sliderInEth);

        const checkNewRate = await contract.getRate();
        console.log(`New Current Rate on chain`,checkNewRate.toString());

    };


    const Admin = ({rate}) => {
        return <div>
            <Box>
                <h3>Set Your Minutely Rate</h3>
                <Slider defaultValue={parseFloat(rate)}
                        step={0.001}
                        min={0}
                        max={.1}
                        marks={marks}
                        valueLabelDisplay="auto"
                        onChangeCommitted={handleSliderChange} />
                <br /><br />
                <Button onClick={saveRate} variant="contained">save configuration</Button>
            </Box>
        </div>
    }

    const ConfirmDialog = () => {
        return <Dialog open={true}>
            <h3>
                {mined && 'Appointment Confirmed'}
                {!mined && !showSign && 'Confirming Your Appointment...'}
                {!mined && showSign && 'Please Sign to Confirm'}
            </h3>
            <div style={{textAlign: 'left', padding: '0px 20px 20px 20px'}}>
                {mined && <div>
                    Your appointment has been confirmed and is on the blockchain.<br /><br />
                    <a target="_blank" href={`https://goerli.etherscan.io/tx/${transactionHash}`}>View on Etherscan</a>
                </div>}
                {!mined && !showSign && <div><p>Please wait while we confirm your appointment on the blockchain....</p></div>}
                {!mined && showSign && <div><p>Please sign the transaction to confirm your appointment.</p></div>}
            </div>
            <div style={{textAlign: 'center', paddingBottom: '30px'}}>
                {!mined && <CircularProgress />}
            </div>
            {mined &&
                <Button onClick={() => {
                    setShowDialog(false);
                    getData();
                }
                }>Close</Button>}
        </Dialog>
    }

    return (
        <>
        <div id="admin">
            <div>Rate: {rate}</div>
            <div>Showadmin: {showAdmin ? "yes": "no"}</div>
            <div>Owner is admin:{isAdmin ? "yes": "no"}</div>
            <div>Appointment length{appointments.length ? appointments.length: 0}</div>
            {isAdmin && <Button onClick={() => setShowAdmin(!showAdmin)} variant="contained" startIcon={<SettingsSuggestIcon />}>Admin</Button>}
        </div>
    <div id="calendar">
        <Scheduler data={appointments.length ? appointments: schedulerData}>
            <ViewState />
            <EditingState onCommitChanges={saveAppointment} />
            <IntegratedEditing />
            <WeekView startDayHour={9} endDayHour={19}/>
            <Appointments />
            <AppointmentForm />
        </Scheduler>
    </div>
    {showDialog && <ConfirmDialog />}
</>);
}

export default Calendar;


// Admin section





