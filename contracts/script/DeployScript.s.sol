// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {StakedETH} from "../sETH.sol";
import {DepositETH} from "../dETH.sol";
import {Governance} from "../Governance.sol";

contract DeployScript is Script {
    DepositETH public depositETH;
    StakedETH public stakedETH;
    Governance public governance;
    address public owner = 0xa2791e44234Dc9C96F260aD15fdD09Fe9B597FE1;

    function run() external {
        vm.startBroadcast();

        depositETH = new DepositETH();

        stakedETH = new StakedETH(payable(address(depositETH)));
        governance = new Governance(address(stakedETH));

        // Mint some sETH tokens to interact with the governance contract  
        stakedETH.mint(owner, 10 ether);

        console.log("DepositETH contract address", address(depositETH));
        console.log("StakedETH contract address", address(stakedETH));
        console.log("GOVERNANCE contract address", address(governance));

        vm.stopBroadcast();
    }
}