#!/bin/bash

echo "Testing ATP Example Agents..."

# Build the example agents first
cd examples/simple-agent
echo "Building example agents..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Agent build failed!"
    exit 1
fi

# Test weather agent in background
echo "Testing Weather Agent (10 seconds)..."
timeout 10s npm start weather > weather-agent.log 2>&1 &
WEATHER_PID=$!

# Test calculator agent in background  
echo "Testing Calculator Agent (10 seconds)..."
timeout 10s npm start calculator > calculator-agent.log 2>&1 &
CALC_PID=$!

# Wait for tests to complete
wait $WEATHER_PID
WEATHER_EXIT=$?

wait $CALC_PID  
CALC_EXIT=$?

# Show results
echo "Weather Agent Results:"
if [ $WEATHER_EXIT -eq 124 ]; then
    echo "✅ Weather Agent ran successfully (timeout as expected)"
    tail -5 weather-agent.log
else
    echo "❌ Weather Agent failed with exit code $WEATHER_EXIT"
    cat weather-agent.log
fi

echo ""
echo "Calculator Agent Results:"
if [ $CALC_EXIT -eq 124 ]; then
    echo "✅ Calculator Agent ran successfully (timeout as expected)"
    tail -5 calculator-agent.log
else
    echo "❌ Calculator Agent failed with exit code $CALC_EXIT"
    cat calculator-agent.log
fi

# Cleanup
rm -f weather-agent.log calculator-agent.log

echo "Agent testing complete!"
cd ../..