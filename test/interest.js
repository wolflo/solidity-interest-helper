const InterestContract = artifacts.require('../contracts/Interest');
const assert = require('assert');
const BN = require('bignumber.js');


contract("InterestHelper", function(accounts) {
    let Interest;

    BN.config({ DECIMAL_PLACES: 27, POW_PRECISION: 100})
    // Note: Web3 1.0 returns and accepts bn.js objects instead of bignumber.js 
    // objects. bn.js does not support decimals, so it is significantly less 
    // useful for our purposes. So, there are a few hacks throughout to make
    // this work

    // You can make rates, principals, and maturities at small or as large as
    // you want, but at a certain point you will either overflow the uint256 in
    // the contract or run into some weird JS quirks with very small / large numbers
    
    let tinyRate = new BN(0.000005);    // 0.0005% nominal interest per year, compounded continuously
        // Note: If you want to test a smaller interest rate than this,
        // you have to pass it as a string. Otherwise the JS toString() method
        // will fail when passing to web3.utils.toWei()
    let smallRate = new BN(0.005);  // 0.5% nominal interest per year, compounded continuously
    let rate = new BN(0.05);    // 5% nominal interest per year, compounded continuously
    let bigRate = new BN(0.50);  // 50% nominal interest per year, compounded continuously
    let hugeRate = new BN(1);   // 100% nominal interest per year, compounded continuously

    let tinyPrincipal = new BN(1);   // 1 Wei
    let smallPrincipal = new BN(web3.utils.toWei('0.0000000001', 'ether'));
    let principal = new BN(web3.utils.toWei('1', 'ether'));
    let bigPrincipal = new BN(web3.utils.toWei('100', 'ether'));
    let hugePrincipal = new BN(web3.utils.toWei('1000000', 'ether'));

    let tinyMaturity = new BN(1);   // 1 second
    let smallMaturity = new BN(600);    // 10 minutes
    let maturity = new BN(36000);   // 10 hours
    let bigMaturity = new BN(86400 * 10);   // 10 days
    let hugeMaturity = new BN(365 * 86400 * 50);   // 50 years


    beforeEach("Instantiate DSInterest contract", async() => {
        Interest = await InterestContract.new();
    });


    function yearlyRateToRay(rate) {
        
        // rate = new BN(_rate);
        ten = new BN(10);
        return rate.div(365 * 86400).plus(1).times(ten.pow(27))
    }


    function accrueInterest(principal, rateRay, age) {
        ten = new BN(10)
        
        return rateRay.div(ten.pow(27)).pow(age).times(principal);
    }


    it("Check yearlyRateToRay() function", async() => {
        
        // Check that yearly interest rates are converted to ray correctly.
        // Save and use the bignumber.js objects 

        tinyRateRay = await Interest.yearlyRateToRay(web3.utils.toWei(tinyRate.toString(), 'ether'));
        assert.equal(
            tinyRateRay, 
            yearlyRateToRay(tinyRate).toFixed(0), 
            "Incorrect ray returned for tinyRate."
        );

        smallRateRay = await Interest.yearlyRateToRay(web3.utils.toWei(smallRate.toString(), 'ether'));
        assert.equal(
            smallRateRay, 
            yearlyRateToRay(smallRate).toFixed(0), 
            "Incorrect ray returned for smallRate."
        );

        rateRay = await Interest.yearlyRateToRay(web3.utils.toWei(rate.toString(), 'ether'));
        assert.equal(
            rateRay, 
            yearlyRateToRay(rate).toFixed(0), 
            "Incorrect ray returned for regular rate."
        );

        bigRateRay = await Interest.yearlyRateToRay(web3.utils.toWei(bigRate.toString(), 'ether'));
        assert.equal(
            bigRateRay, 
            yearlyRateToRay(bigRate).toFixed(0), 
            "Incorrect ray returned for bigRate."
        );

        hugeRateRay = await Interest.yearlyRateToRay(web3.utils.toWei(hugeRate.toString(), 'ether'));
        assert.equal(
            hugeRateRay, 
            yearlyRateToRay(hugeRate).toFixed(0), 
            "Incorrect ray returned for hugeRate."
        );

    });


    it("Check accrueInterest() function", async() => {
        // Save and use the bignumber.js objects for interest rates as rays
        tinyRateRayBN = yearlyRateToRay(tinyRate)
        smallRateRayBN = yearlyRateToRay(smallRate)
        rateRayBN = yearlyRateToRay(rate)
        bigRateRayBN = yearlyRateToRay(bigRate)
        hugeRateRayBN = yearlyRateToRay(hugeRate)
        
        // Check principal return values for a combination of different
        // interest rates, principals, and maturity times 
        // Contract calls include web3.utils.toBN because web3 1.0 wants 
        // bn.js objects, and we want to use bignumber.js objects for 
        // the decimal support

        testCases = [
            {principal: tinyPrincipal, rate: tinyRateRayBN, age: tinyMaturity},
            {principal: smallPrincipal, rate: smallRateRayBN, age: smallMaturity},
            {principal: principal, rate: rateRayBN, age: maturity},
            {principal: bigPrincipal, rate: bigRateRayBN, age: bigMaturity},
            {principal: tinyPrincipal, rate: hugeRateRayBN, age: tinyMaturity},
            {principal: hugePrincipal, rate: tinyRateRayBN, age: tinyMaturity},
            {principal: tinyPrincipal, rate: tinyRateRayBN, age: hugeMaturity},
        ]

        for (let i = 0; i < testCases.length; i++) {

            _principal = testCases[i].principal
            _rateRay = testCases[i].rate
            _age = testCases[i].age

            newPrincipal = await Interest.accrueInterest(
                web3.utils.toBN(_principal),
                web3.utils.toBN(_rateRay),
                web3.utils.toBN(_age)
            );

            assert.equal(
                newPrincipal,
                accrueInterest(_principal, _rateRay, _age).toFixed(0),
                "accrueInterest() test failed for these values: " + JSON.stringify(testCases[i])
            )
        }

    });
});