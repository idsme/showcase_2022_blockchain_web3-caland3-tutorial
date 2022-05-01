// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Strings.sol";

// Features:
// Overlapping meetings are not allowed.
// Is no real problem if owner books him self and pays... makes all functionality easier to test. As no contract.connects needs to be done in test.
// Paying more is allowed but not more then twice amount that is asked. (100% tip is enough). This guards against client making types.. and asking some money back if they put decimal comma at wrong place.@author

// Features for future...
// How much tip was received in payments received?
// More event logging. more require() to validate input.
// Can security of this contract be improved?
// Can gas fees surrounding this contract be reduced?
// Revert vs Require? What results in cleaner solution?

contract Calend3 {

    uint rate = 1;
    address owner;
    event Deposit(address indexed _sender, address indexed _owner, uint _amount);

    struct Appointment {
        string title;     // title of the meeting
        address attendee; // person you are meeting
        uint startTime;   // start time of meeting
        uint endTime;     // end time of the meeting
        uint amountPaid;  // amount paid for the meeting
    }

    event Booking(Appointment _appointment);

    // TODO IDSME currently but would a mapp not offer better functionality... || performance
    Appointment[] appointments;

    constructor(uint _rate) {
        owner = payable(msg.sender); // casts upgrades address to a payable address
        rate = _rate;
    }

    function createAppointment(string memory _title, uint _startTime, uint _endTime) public payable returns (Appointment memory) {
        // TODO IDSME Do some require checks.. require(msg.sender == owner, "Only owner can change rate"); for each argument.
        uint _amountPaid = msg.value;
        uint  minimum_payment_amount = (_endTime - _startTime) * rate;
        if (_startTime >= _endTime) {
            revert('start time must be before end time');
        }
        if (_amountPaid < minimum_payment_amount) {
            string memory error_message = string(bytes.concat(bytes("You need to pay at least: "), bytes(Strings.toString(minimum_payment_amount)), bytes(", you tried to pay: "), bytes(Strings.toString(_amountPaid)), bytes(" WEI")));
            revert(error_message);
        } else if (_amountPaid > minimum_payment_amount && _amountPaid < minimum_payment_amount * 2) {
            // Thanks for the tip event..
        } else if (_amountPaid > (minimum_payment_amount * 2)) {
            string memory error_message =
            string(
                bytes.concat(
                    bytes("You payed to much, payment cannot cannot exceed 200%, you payed: "),
                    bytes(Strings.toString(_amountPaid * 100 / minimum_payment_amount)),
                    bytes("%")
                )
            );
            revert(error_message);
        } else {
            // TODO IDSME log event. You have made an appointment.. Thanks for your business.
        }


        for (uint i = 0; i < appointments.length; i++)
        { // If over lap revert.
            // What if exactly the same time... same haf our... what happens test this.
            if (_startTime < appointments[i].startTime && _endTime > appointments[i].startTime)
            {
                revert('New appointment request overlaps start of already existing appointment');
            }
            else if (_startTime < appointments[i].endTime && _endTime > appointments[i].endTime)
            {
                revert('New appointment request overlaps end of already existing appointment');
            }
            else if (_startTime > appointments[i].startTime && _endTime < appointments[i].endTime)
            {
                revert('New appointment request overlaps as falls within the time of an already existing appointment');
            }
            else if (_startTime == appointments[i].startTime && _endTime == appointments[i].endTime)
            {
                revert('New appointment request starts and ends exactly with an existing already appointment');
            }
            else // pure else statement false.. fix this... as is strange bug in Solidity compiler?
            {
                // TODO IDSME ... if all of above don't apply then appointment can be made as we have room in agenda.
                emit Deposit(msg.sender, owner, msg.value);
                //revert('Unexpected condition.... reverting money to be safe.');
            }
        }

        (bool success,) = owner.call{value: msg.value}("");
        require(success, "Failed to send money to owner");

        Appointment memory appointment = Appointment(_title, msg.sender, _startTime, _endTime, _amountPaid);
//        appointment.title = _title;
//        appointment.startTime = _startTime;
//        appointment.endTime = _endTime;
//        appointment.amountPaid = minimum_payment_amount;
//        appointments.attendee = msg.sender; // compilation error... now using above but... verify that this functions return info is now correct.
        appointments.push(appointment);

        emit Booking(appointment);
        //appointments.push(Appointment(_title, msg.sender, _startTime, _endTime, _amountPaid));

        return appointments[appointments.length - 1];
    }

    function getAppointments() public view returns (Appointment[] memory) {
        return appointments;
    }

    function getRate() public view returns (uint) {
        return rate;
    }

    function getRatePer( uint _minutes) public view returns (uint) {
        return rate * _minutes;
    }

    function getRatePerHour() public view returns (uint) {
        return getRatePer(60);
    }

    function setRate(uint _rate) public {
        require(msg.sender == owner, "Only owner can change rate");
        rate = _rate;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
}
