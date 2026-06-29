import { bandFor, resolveDread } from './roll.js';

let pass = 0;
let fail = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  PASS: ${msg}`);
    pass++;
  } else {
    console.error(`  FAIL: ${msg}`);
    fail++;
  }
}

// Band boundary tests: spec says 1-2 CF, 3-5 FP, 6-8 ST, 9-11 S, 12+ CS
assert(bandFor(2) === 'Complete Failure', 'bandFor(2) = Complete Failure');
assert(bandFor(3) === 'Failure with a Plus', 'bandFor(3) = Failure with a Plus');
assert(bandFor(5) === 'Failure with a Plus', 'bandFor(5) = Failure with a Plus');
assert(bandFor(6) === 'Success with a Twist', 'bandFor(6) = Success with a Twist');
assert(bandFor(8) === 'Success with a Twist', 'bandFor(8) = Success with a Twist');
assert(bandFor(9) === 'Success', 'bandFor(9) = Success');
assert(bandFor(11) === 'Success', 'bandFor(11) = Success');
assert(bandFor(12) === 'Complete Success', 'bandFor(12) = Complete Success');
assert(bandFor(13) === 'Complete Success', 'bandFor(13) = Complete Success');

// Also verify the lower bound of the bottom band
assert(bandFor(1) === 'Complete Failure', 'bandFor(1) = Complete Failure');
assert(bandFor(0) === 'Complete Failure', 'bandFor(0) = Complete Failure');
assert(bandFor(-5) === 'Complete Failure', 'bandFor(-5) = Complete Failure');

// Dread die range: resolveDread('d8') must always return 1-8
let dreadOk = true;
for (let i = 0; i < 200; i++) {
  const { die } = resolveDread('d8');
  if (die < 1 || die > 8) { dreadOk = false; break; }
}
assert(dreadOk, "resolveDread('d8') always returns 1-8 over 200 rolls");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
