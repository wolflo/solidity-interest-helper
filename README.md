# Solidity Interest Helper
An implementation of ([approximately](#approximation)) continuously compounding interest in Solidity. I put this together as part of a larger project that I'm working on.
  
## Details  
InterestHelper uses <a href="https://github.com/dapphub/ds-math">DSMath</a>'s ray and wad math, which is an implementation of fixed point arithmetic for Solidity. The basic scale factors are:  
wei -> the base unit  
wad -> wei * 10 ** 18. 1 ether = 1 wad, so ```0.5 ether``` can be used to represent a decimal wad of 0.5  
ray -> wei * 10 ** 27  
  
### accrueInterest(uint _principal, uint _rate, uint _age)
Uses discretely compounded interest on a period of 1 second to approximate continuously compounded interest.  
- ```_principal``` The principal to calculate the interest on, in Wei.  
- ```_rate``` The interest rate. Accepted as a ray representing 1 + the effective interest rate per second, compounded every second.  
- ```_age``` The time period over which to accrue interest, in seconds.  
- Returns the new principal as a wad. Equal to original principal + interest accrued  
 
As an example:  
I want to accrue interest at a nominal rate, i, of 5.0% per year, compounded continuously (equivalent to an Effective Annual Rate of 5.127%). This is approximately equal to 5.0% per year compounded every second (to about 8 decimal places). If maximum precision is essential, you should calculate effective interest per second directly from your desired effective annual rate and see the [Approximation](#approximation) section.  
The Effective Rate Per Second = Nominal Rate Per Second compounded every second = Nominal Rate Per Year compounded every second * conversion factor from years to seconds   
```Effective Rate Per Second = 0.05 / (365 days/yr * 86400 sec/day) = 1.5854895991882 * 10 ** -9```  

The value we want to send the accrueInterest() function is:  
```1 * 10 ** 27 + Effective Rate Per Second * 10 ** 27 = 1000000001585489599188229325```  

So, for this nominal 5% annual rate compounded continuously, on a 100 Dai principal (represented as a wad by appending the ```ether``` suffix) over the course of one year (31536000 seconds),  
```accrueInterest(100 ether, 1000000001585489599188229325, 31536000)```  

will return 5.1271096334354555 Dai.

### yearlyRateToRay(uint _rateWad)
This function is not actually used in the contract, but can help determine the correct value for the ```_rate``` parameter in accrueInterest(). It accepts ```_rateWad```, a wad of the desired nominal interest rate per year, compounded every second (this is approximately equal to nominal interest rate per year compounded continuously). It returns the ray value expected by the accrueInterest function. As an example, we could call this function with the same 5% nominal yearly rate compounded continuously from above. Converting from ether to wei will effectively convert from a decimal value to a wad, so 5% rate = 0.05 can be used as follows:  
```yearlyRateToRay( 0.05 ether )```  
Which will return ```1000000001585489599188229325```.  
This is ```= 1 * 10 ** 27 + Effective Interest Rate Per Second * 10 ** 27```

### Approximation  
The standard formula for the future value of an asset with discretely compounded interest is:  
```FV = P(1 + i/n) ** (n * t)```  
where:  
- FV = the Future value of the asset  
- P = The principal, or present value  
- i = the nominal interest rate per period (where period is typically 1 year, but we ultimately make it 1 second)  
- n =  The number of compounding periods within each interest period.  

As we increase the number of compounding periods, the effective interest rate (the actual increase in value over the interest period) increases. Taking the limit of the above equation as n approaches infinity gives us the equation for continuously compounded interest:  
```FV = P * e ** (r * t)```  

On the blockchain, this is typically the way that we want to calculate interest, because the lifetimes of interest accruing positions can be highly variable and it is important to track small amounts of interest. Unfortunately, it is also difficult to efficiently exponentiate a floating point base with a floating point exponent (one interesting solution to this is <a href="https://github.com/dydxprotocol/protocol/blob/master/contracts/lib/Exponent.sol">pre-computing</a> e^x values). To get around this, the InterestHelper contract calculates discretely compounded interest with a 1-second interest period, the idea being that 1 second is close enough to continuously compounding for most applications.  

So, is it good enough for your application? I don't know (and you should check carefully for yourself before using it), but here are a couple of values to give you a general idea of the scale of the differences between true continuous compounding interest and our approximation (all of the values are stated in USD for ease of understanding, but $0.04 on $1 million is the same as 0.04 Dai/Eth/etc. on 1 million Dai/Eth/etc.):  
- Over 10 years, at 5% nominal yearly interest on a principal of $1 million, difference = $0.04
- Over 10 years, at 60% nominal yearly interest on a principal of $1,000, difference = $0.04
- Over 100 years, at 5% nominal yearly interest on a principal of $1,000, difference = $0.03

## Usage
The main contract is ./contracts/InterestHelper.sol, which inherits from ./lib/DSMath.sol. It is currently compiled using Solidity ^0.5.1, but it should work with 0.4 versions as well if you change the pragma.  

### To run tests:
Make sure truffle v5 is installed globally:  
```npm install -g truffle```  
```git clone https://github.com/nward13/solidity-interest-helper.git && cd solidity-interest-helper```  
```npm install```  
```truffle test```
