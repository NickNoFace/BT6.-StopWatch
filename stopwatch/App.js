import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [running, setRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [laps, setLaps] = useState([]);
  const [circleProgress, setCircleProgress] = useState(0);
  const [timeUnit, setTimeUnit] = useState('seconds');
  const [note, setNote] = useState('');
  const [countdownTime, setCountdownTime] = useState(3000);
  const [countdownRunning, setCountdownRunning] = useState(false);

  const saveState = async () => {
    try {
      const state = { running, elapsedTime, laps, circleProgress, timeUnit, note, countdownTime, countdownRunning };
      await AsyncStorage.setItem('stopwatchState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  const loadState = async () => {
    try {
      const savedState = await AsyncStorage.getItem('stopwatchState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setRunning(parsedState.running);
        setElapsedTime(parsedState.elapsedTime);
        setLaps(parsedState.laps);
        setCircleProgress(parsedState.circleProgress);
        setTimeUnit(parsedState.timeUnit);
        setNote(parsedState.note);
        setCountdownTime(parsedState.countdownTime);
        setCountdownRunning(parsedState.countdownRunning);
      }
    } catch (error) {
      console.error('Error loading state:', error);
    }
  };

  useEffect(() => {
    loadState();
  }, []); // Load state only once when the component mounts

  useEffect(() => {
    saveState();
  }, [running, elapsedTime, laps, circleProgress, timeUnit, note, countdownTime, countdownRunning]);

  useEffect(() => {
    let interval;
    if (countdownRunning) {
      interval = setInterval(() => {
        setCountdownTime((prevCountdownTime) => {
          const newCountdownTime = prevCountdownTime - 10;

          if (newCountdownTime <= 0) {
            setCountdownRunning(false);
            setRunning(true);
            return 0;
          }

          return newCountdownTime;
        });
      }, 10);
    } else if (running) {
      interval = setInterval(() => {
        setElapsedTime((prevElapsedTime) => {
          const newElapsedTime = prevElapsedTime + 10;
          setCircleProgress((newElapsedTime / 60000) % 1);
          return newElapsedTime;
        });
      }, 10);
    } else {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [countdownRunning, running]);

  const startCountdown = () => {
    setCountdownRunning(true);
  };

  const startStop = () => {
    if (countdownTime > 0) {
      setCountdownRunning(false);
    } else {
      setCountdownRunning(false);
      setRunning(!running);
    }
  };

  const resetCountdown = () => {
    setCountdownTime(3000);
    setCountdownRunning(false);
  };

  const updateNote = () => {
    setLaps([...laps, { time: elapsedTime, note }]);
    setNote('');
  };

  const lapReset = () => {
    if (running) {
      updateNote();
    } else {
      setElapsedTime(0);
      setLaps([]);
      setCircleProgress(0);
      resetCountdown();
    }
  };

  const updateCountdownTime = () => {
    if (!running && !countdownRunning) {
      setCountdownTime(countdownTime);
    }
  };

  const formatTime = (time, timeUnit) => {
    let totalSeconds = time / 1000;
    let formattedTime;

    if (timeUnit === 'hours') {
      const hours = Math.floor(totalSeconds / 3600);
      totalSeconds %= 3600;
      formattedTime = pad(hours) + ':' + pad(Math.floor(totalSeconds / 60)) + ':' + pad(Math.floor(totalSeconds % 60));
    } else if (timeUnit === 'minutes') {
      formattedTime = pad(Math.floor(totalSeconds / 60)) + ':' + pad(Math.floor(totalSeconds % 60));
    } else {
      formattedTime = pad(Math.floor(totalSeconds)) + '.' + pad(time % 1000, 3);
    }

    return formattedTime;
  };

  const pad = (num, size = 2) => {
    let s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  };

  return (
    <View style={styles.container}>
      <Svg height="200" width="200">
        <Circle
          cx="100"
          cy="100"
          r="90"
          stroke="#4CAF50"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={[Math.PI * 2 * 90, Math.PI * 2 * 90]}
          strokeDashoffset={Math.PI * 2 * 90 * (1 - circleProgress)}
        />
      </Svg>
      <Text style={styles.timer}>{formatTime(countdownTime > 0 ? countdownTime : elapsedTime, timeUnit)}</Text>
      <View style={styles.timeUnitContainer}>
        <TouchableOpacity
          style={[styles.timeUnitButton, timeUnit === 'seconds' && styles.selectedTimeUnit]}
          onPress={() => setTimeUnit('seconds')}
        >
          <Text style={styles.timeUnitButtonText}>Seconds</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeUnitButton, timeUnit === 'minutes' && styles.selectedTimeUnit]}
          onPress={() => setTimeUnit('minutes')}
        >
          <Text style={styles.timeUnitButtonText}>Minutes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeUnitButton, timeUnit === 'hours' && styles.selectedTimeUnit]}
          onPress={() => setTimeUnit('hours')}
        >
          <Text style={styles.timeUnitButtonText}>Hours</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.columnContainer}>
        <TextInput
          style={styles.noteInput}
          placeholder="Add Note..."
          value={note}
          onChangeText={(text) => setNote(text)}
        />
        <TextInput
          style={styles.noteInput}
          placeholder="Set Countdown Time (ms)"
          keyboardType="numeric"
          value={countdownTime.toString()}
          onChangeText={(text) => setCountdownTime(parseInt(text) || 0)}
          onBlur={updateCountdownTime}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={startCountdown}>
            <Text>Start Countdown</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={startStop}>
            <Text>{countdownTime > 0 ? 'Stop Countdown' : running ? 'Stop' : 'Start'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={lapReset}>
            <Text>{countdownTime > 0 ? 'Reset Countdown' : running ? 'Lap' : 'Reset'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={updateNote}>
            <Text>Add Note</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.lapsContainer}>
        {laps.map((lap, index) => (
          <Text key={index} style={styles.lapText}>
            Lap {index + 1}: {formatTime(lap.time, timeUnit)}{lap.note && ` - ${lap.note}`}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  timer: {
    fontSize: 40,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    marginBottom: 20,
    alignItems: 'center',
  },
  button: {
    marginHorizontal: 10,
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  noteInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 50,
    marginBottom: 5,
    paddingLeft: 10,
  },
  lapsContainer: {
    alignItems: 'flex-start',
  },
  lapText: {
    fontSize: 20,
    marginVertical: 5,
  },
  timeUnitContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  timeUnitButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 5,
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    marginBottom: 10,
  },
  selectedTimeUnit: {
    backgroundColor: '#2E7D32',
  },
  timeUnitButtonText: {
    color: 'white',
  },
  columnContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
});

export default App;
