#!/bin/bash

# Clean up npm debug logs from running the ILP kit previously. These build
# up fast otherwise, due to how many components are being launched. `killall -9
# node` will ensure that the previous process is killed before a new one is
# launched. Be careful running this command during a period of high activity,
# as it could disrupt in-flight payments.
rm npm-debug*
killall -9 node

# Get debug output from all ILP components by setting DEBUG. `nohup` makes sure
# that this background process won't die, even if the shell that spawned it
# dies. `npm start &` will launch the ILP Kit in the background.
DEBUG=ilp* nohup npm start &

# Now attach to the output file, and print from it as the file is updated. You
# can run `tail -f nohup.out` from any shell to see the ILP Kit logs.
tail -f nohup.out
