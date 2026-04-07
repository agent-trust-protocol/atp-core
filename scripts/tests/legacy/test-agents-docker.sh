#!/bin/bash

echo "Testing example agents with Docker services..."

# Set the gateway URL to use Docker services
export ATP_GATEWAY="ws://localhost:8081/rpc"

# Build the example agent
cd examples/simple-agent
echo "Building example agent..."
npm run build

if [ $? -ne 0 ]; then
    echo "Agent build failed!"
    exit 1
fi

# Test weather agent (run for 10 seconds)
echo "Testing Weather Agent..."
timeout 10s npm start weather &
WEATHER_PID=$!

# Test calculator agent (run for 10 seconds)  
echo "Testing Calculator Agent..."
timeout 10s npm start calculator &
CALC_PID=$!

# Wait for tests to complete
wait $WEATHER_PID
wait $CALC_PID

echo "Agent tests complete!"

# Go back to root directory
cd ../..