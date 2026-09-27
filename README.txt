//=================================================================//
This is a Meditation website to be used as a PWA for mobile devices
The meditation app has the following functionalities
- A timer the counts down a specified duration
- Audio is played at the begginning and end of a session
- The session date and duration data is saved
- A statistics page that dynamically shows the following
    - A comparision of a current duration with 2 prior durations
    - A total lifetime hours meditated which takes input from
    meditation before using the app and retreats
//=================================================================//

CONSTANTS
- Set the meditation length to 30 minutes in milliseconds
- Set the outro trigger to 2 minutes and 54 seconds before the end
- Define the localStorage key "meditationHistory"

STATE
- Set wakeLock to null
- Set outroNotPlayed to true
- Set timerID to null
- Initialize targetTime
- Set the default chart grouping to 'day'
- Set the default chart spacing to 'od'
- Set myChart to null


DOM AND AUDIO
- Find timer, buttons, checkbox, selectors, history, and chart canvas
- Create audio objects for introChanting, outroChanting, and chime


DATA STORAGE
logSession():
- Calculate the remaining time using targetTime minus the current time
- Calculate elapsed time:
    - Never exceed configured session length
    - Never record a negative duration
- Create a session object containing:
    -date: the current timestamp
    -duration: elapsed milliseconds
- Read the existing history array from localStorage
- Append the new session
- Save the updated array back to localStorage

STATISTICS
collectStatistics(grouping):
- Read all sessions from localStorage
- For each session:
    - Convert its timestamp into a date
    - If grouping is 'week', move the date to that week's Sunday
    - If grouping is 'month', move the date to the first of the month
    - If grouping is 'year', move the date to January 1
    - If grouping is 'day', keep the date unchanged
    - Convert the date to a local YYYY-MM-DD key
    - Add the session duration to the key's existing total
-Return an object mapping period keys to total milliseconds

FORMATTING
formatTime(milliseconds):
- Convert milliseconds into minutes and seconds
- Return a padded string such as 25:43

getLocalDateKey(date):
- Return the date as YYYY-MM-DD using local time

CHART DATA
generateChartData(grouping, spacing):
- Collect totals using the selected groupings

- Call collectStatistics(grouping)
    - This returns totals grouped by day, week, month, or year
    - Example:
        {
            "2026-09-25: 1800000,
            "2026-09-26: 1200000
        }

- Create empty labels and barValue arrays
- Get todays date

- Create three target dates:
    - 'od': last three days
    - 'ow': last 3 weeks
    - 'om': last three months
    - 'oy': last 3 years
- Normalize each target date to the selected grouping:
    - week: Sunday
    - month: first day of the month
    - year: January 1
    - day: unchanged

- Convert the target date into a YYYY-MM-DD key
- Find the matching total in the statistics object
- If there is no matching total, use 0
- Convert milliseconds into minutes
- Create a readable label for the date
- Add the label and value to the chart arrays

- Return an object that chart.js expects
 {
    labels: [],
    datasets: [{
        label:,
        data:[]
    }]
 }

WAKE LOCK
requestWakeLock():
- Request a screen wake lock from the browser
- Store the returned lock object
- Log an error if the browser rejest the request

TIMER
checkTime():
- Calculate remaining time from targetTime
- If time remains:
    - Display the formatted remaining time
    - When the outro threshold is reach and outro not played:
        - Play the chime if chanting is disabled
        - Otherwise play the outro chant
        - Mark the outro as played
    - Schedule checkTime to run every second
- When time reaches zero:
    - End the session
    - Reset the outro state

UI RESET
resetAppUI():
- Show start and hide stop
- Reset the display to 30:00
- pause and rewind all audios
- Set outroNotPlayed back to true

SESSION END
handleSessionEnd():
- Clear the pending timer
- Save the elapsed session
- Set outroNotPlayed back to true

EVENTS
Start:
- Set targetTime to 30 minutes from now
- Reset the outro state
- Unlock audio
- Play the intro or chime according to checkbox
- Request a wake lock
- Start the countdown
- Hide start and show stop

Stop:
- Clear the countdown
- Save the elapsed time
- Reset the interface

History:
- Read and parse saved sessions
- Format dates and durations for display
- Toggle the formatted history on the page

Chart Selectors:
- Update the current groupings
- Regenerate the chart

INITIALIZATION
- If the chart canvas exists, create the chart.js bar chart
- Use the default groupings

		
		