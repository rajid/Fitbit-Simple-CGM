

function HelloWorld(props) {

  return (
    
    <Page>
      <Text>Some general notes on how the watch face displays information are included
        at the end of this configuration page.</Text>
      <Text>(Scroll to end for Release Notes)</Text>
      <Section title={<Text bold align="center">Nightscout base URL:</Text>}>
        <Text>If you are using Nightscout, you can configure your base URL here.
          This turns on the BG monitoring feature.  Make sure to use the "https" version
          of the URL.  (If the status dot,
          in the upper-right, doesn't change to green, then most likely the communication
          between the phone and watch is down; see "Status Dot", near the end of this page.
          If the status dot changes to green but you still see no number in the lower-left
          or arrow in the lower-right, then either your URL is incorrect or your NightScout
          page has old data.)
        </Text>
        <TextInput settingsKey="url" label="eg. https://name.herokuapp.com" type="text" />
        <Text>Minimum update interval.  The watch face will automatically calculate the best
          update interval.  This minimum value is intended for use by a secondary person who may want to
          monitor with less frequent updates, such as 10.</Text>
        <TextInput label="Min. update interval" settingsKey="minUpdate" type="text" />
        <Toggle settingsKey="units" label={`Units: ${props.settings.units === 'true' ? 'mmol/L' : 'bg/dL'}`}/>
      </Section>
      <Section title={<Text bold align="center">BG Low & High limits:</Text>}>
        <Text>Without BG low and high limits, the watch face will not fetch new information
          unless the screen is on.  Setting limits will force the watch face to wakeup and
          fetch new information regularly regardless.
        When a BG low or high alarm occurs, it may be suppressed for various time periods
        (see below).</Text>
        <TextInput settingsKey="low" label="BG Low limit" type="text" />
        <TextInput settingsKey="high" label="BG High limit" type="text" />
        <Text>Settings for receiving a BG warning if the change in values between fetches
          is bigger than a configured amount.
          This can provide additional early warning for rapid rise of fall of BG values.</Text>
        <TextInput settingsKey="diff" label="BG difference notification"/>
        <Text>Sometimes, the BG value may change quite a lot over a longer period of time,
        however each update will not show up as a big change.  (For example, if the value changed
        by -5 every 5 minutes, this could add up to a change of -30 over only a half hour!)
        The next two values are meant to address this; they are the period over which to look
        for a change and the amount of change (positive or negative) to look for.  If this change
        happens over the configured time period, you will receive a buzz notification and
        the arrow color will be changed to yellow to indicate the cause of the warning.</Text>
        <TextInput label="Long term alarm period (min)" settingsKey="longPeriod" type="text" />
        <TextInput label="Long term alarm difference" settingsKey="longDiff" type="text" />
        <Text>This configuration allows the BG number, in the lower-left corner, to be made
          bigger, for better visibility.</Text>
        <TextInput label="Font size for BG number" settingsKey="bgFont1" type="text" />
        <Text>This configuration suppresses vibration notifications, for minor events and for
          communication channel loss, during a period, such as sleep time.
          (Note that if communication between the watch and the phone is lost and can not be
          automatically reset by an auto-restart (see below), then suppressing warnings here will
          mean that your watch will simply sit waiting for something to happen and there will be
          no vibration warning.)
          (Setting the end time to 1 minutes before the start time,
          will result in effectively disabling all extra warnings pretty much all of the time.)
        </Text>
        <TextInput settingsKey="warn-start" label="Quiet Start HH:MM (24hr)" type="text" />
        <TextInput settingsKey="warn-end" label="Quiet End HH:MM (24hr)" type="text" />
      </Section>

      <Section title={<Text bold align="center">Periodic comet settings:</Text>}>
        <Text>A comet can be setup to appear on the watch face after a set period of time.
          This can be useful as a reminder of cannula or sensor changes.
          When the "reset comet" button is pressed, the comet will disappear and will
          reappear after a set number of days.
          The reappearance time can be configured to happen a set number of hours before,
          in order to give notice of the upcoming event.</Text>
 <Button
  label="Touch here to reset comet now"
  onClick={() => { props.settingsStorage.setItem("change", JSON.stringify("now"))}} />
        <TextInput fill="lightblue" settingsKey="changeDate" label="Manual comet update: MM/DD/YYYY HH:MM" type="datetime" />
        <TextInput settingsKey="cometDays" label="Reappear after X days" type="text" />
        <TextInput settingsKey="cometHours" label="Reappear X hours before the event" type="text" />
      <Text  align="center">URL to receive comet reset time:</Text>
        <Text>If a URL is supplied here, it will accessed at the time when the comet is reset.
          Make sure to use the "https" version of the URL.  
        If the URL contains "&lt;c&gt;", this will be substituted with the comet reset date and time,
          in the form "MM/DD/YYYY HH:MM:SS "AM" or "PM"; e.g. "05/11/2018 10:00:00 AM".</Text>
        <TextInput settingsKey="cometURL" label="URL for comet reset" type="text" />
        <Text>When performing a procedure, such as sensor or cannula change, some people
          prefer an initial timer for various purposes. The follow configures a simple minute
          timer which counts down, followed by a notification vibration.</Text>
        <TextInput settingsKey="timer" label="Timer at reset time (minutes)" type="text" />
      </Section>

      <Section title={<Text bold align="center">Watch Face settings:</Text>}>
        <TextInput settingsKey="gradient" label="Gradient background color (lowercase)" type="text" />
        <TextInput settingsKey="hour" label="Hour hand color (lowercase)" type="text" />
        <TextInput settingsKey="minute" label="Minute hand color (lowercase)" type="text" />
        <TextInput settingsKey="second" label="Second hand color (lowercase)" type="text" />
      </Section>

        <Section title={<Text bold align="center">Daily Alarms:</Text>}>
      <Text>Many diabetics will require pills at set times every day.
        This set of alarms will occur every day at the same time.
        When they occur, a "snooze" button is provided with configurable snooze times
        (see below).</Text>
      </Section>
        <Section title={<Text align="left">Daily Alarm 1:</Text>}>
      <TextInput settingsKey="alarm0" label="HH:MM (24hr)" type="text" />
      <TextInput settingsKey="mess0" label="Message" type="text" />
        </Section>
        <Section title={<Text align="left">Daily Alarm 2:</Text>}>
      <TextInput settingsKey="alarm1" label="HH:MM (24hr)" type="text" />
      <TextInput settingsKey="mess1" label="Message" type="text" />
        </Section>
        <Section title={<Text align="left">Daily Alarm 3:</Text>}>
      <TextInput settingsKey="alarm2" label="HH:MM (24hr)" type="text" />
      <TextInput settingsKey="mess2" label="Message" type="text" />
        </Section>
        <Section title={<Text align="left">Daily Alarm 4:</Text>}>
      <TextInput settingsKey="alarm3" label="HH:MM (24hr)" type="text" />
      <TextInput settingsKey="mess3" label="Message" type="text" />
        </Section>
        <Section title={<Text align="left">Daily Alarm 5:</Text>}>
      <TextInput settingsKey="alarm4" label="HH:MM (24hr)" type="text" />
      <TextInput settingsKey="mess4" label="Message" type="text" />
        </Section>
        <Section title={<Text align="left">Daily Alarm 6:</Text>}>
      <TextInput settingsKey="alarm5" label="HH:MM (24hr)" type="text" />
      <TextInput settingsKey="mess5" label="Message" type="text" />
        </Section>
        <Section title={<Text align="left">Daily Alarm 7:</Text>}>
      <TextInput settingsKey="alarm6" label="HH:MM (24hr)" type="text" />
      <TextInput settingsKey="mess6" label="Message" type="text" />
        </Section>
        <Section title={<Text align="left">Daily Alarm 8:</Text>}>
      <TextInput settingsKey="alarm7" label="HH:MM (24hr)" type="text" />
      <TextInput settingsKey="mess7" label="Message" type="text" />
        </Section>
        <Section title={<Text align="left">Daily Alarm 9:</Text>}>
      <TextInput settingsKey="alarm8" label="HH:MM (24hr)" type="text" />
      <TextInput settingsKey="mess8" label="Message" type="text" />
        </Section>
        <Section title={<Text align="left">Daily Alarm 10:</Text>}>
      <TextInput settingsKey="alarm9" label="HH:MM (24hr)" type="text" />
      <TextInput settingsKey="mess9" label="Message" type="text" />
        </Section>

        <Section title={<Text align="left">Alarm Msg Snooze times:</Text>}>
      <TextInput settingsKey="alarmsnooze0" label="minutes" type="text" />
      <TextInput settingsKey="alarmsnooze1" label="minutes" type="text" />
      <TextInput settingsKey="alarmsnooze2" label="minutes" type="text" />
      <TextInput settingsKey="alarmsnooze3" label="minutes" type="text" />
      <TextInput settingsKey="alarmsnooze4" label="minutes" type="text" />
      <TextInput settingsKey="alarmsnooze5" label="minutes" type="text" />
      <TextInput settingsKey="alarmsnooze6" label="minutes" type="text" />
      <TextInput settingsKey="alarmsnooze7" label="minutes" type="text" />
      </Section>

        <Section title={<Text align="left">BG Alarm Msg Suppress times:</Text>}>
      <TextInput settingsKey="bgsnooze0" label="minutes" type="text" />
      <TextInput settingsKey="bgsnooze1" label="minutes" type="text" />
      <TextInput settingsKey="bgsnooze2" label="minutes" type="text" />
      <TextInput settingsKey="bgsnooze3" label="minutes" type="text" />
      <TextInput settingsKey="bgsnooze4" label="minutes" type="text" />
      <TextInput settingsKey="bgsnooze5" label="minutes" type="text" />
      <TextInput settingsKey="bgsnooze6" label="minutes" type="text" />
      <TextInput settingsKey="bgsnooze7" label="minutes" type="text" />
      </Section>
      
      <Section title={<Text align="center">General operation notes:</Text>}>
        <Text align="left" bold>Reading the time and date:</Text>
        Read the hour by looking a the position of the earth with respect to the sun.
        Read the minutes by looking at the position of the moon with respect to the earth.
        Read the day of the week by looking at the position of the comet with respect to the sun.

        (The comet revolves around the sun every week, with Sunday at the top, so the first half
        of the week [Monday, Tuesday, Wednesday] it will be on the right and second half
        of the week [Thursday, Friday, Saturday] it will be on the left.)
        <Text>
        Touch anywhere on the display in order to display Month and Date in the top-left and top-right
        corners, respectively, and the Hour and Minute (in 24 hour format) in the bottom-left
        and bottom-right corners, respectively.
        </Text>
        
        <Text align="left" bold>Battery power level:</Text>
        Battery level is indicated by the size of the graduated background color.

        <Text align="left" bold>Daily alarms:</Text>
        Up to ten daily alarms with associated notes may be configured.  They will each automatically
        reschedule for the next day upon being dismissed.  They can each be snoozed for various amounts
        of time and the set of possible snooze times is configurable.
        
        
      </Section>
      <Section title={<Text align="center">NightScout related notes:</Text>}>
        <Text align="left" bold>Blood Glucose value display:</Text>
        The sensor blood glucose value is displayed in the lower-left of the screen.
        The number will gradually fade over time, to indicate the usefullness of the value.
        When an update occurs, the number will be refreshed.
        (The general rule is, if you can't read the number, then it's so old that it isn't
        representative anyway and shouldn't be used!)
        Touching the blood glucose value number will display a graph (see below) of the last 24 values.
        
        <Text align="left" bold>Status dot (upper-right):</Text>
        The dot in the upper-right indicates the status of the connection between the watch and the phone.
        The dot will be white if status is indeterminate (no communication has been attempted).
        This is the usual case when the watch face has just started.
        The dot should almost immediately turn green to indicate that a message has been correctly sent to the phone.
        If the dot stays white, it probably means that the communication channel to the phone was not initialized correctly.
        This can sometimes happen when switching apps on the watch very quickly.  Just restart the app on the watch.
        (Do this by pressing and holding the "back" button and the "down" buttons simultaneously, until the screen goes black,
        then immediately release them.  [Holding them both longer will force-restart the entire watch.])
        The dot will turn red if one or more messages to the phone were not sent correctly.
        This means the communication channel is down.  Many times simply restarting the app will reset things
        (see "Auto-restart functionality", below).
        If not, check to make sure the Fitbit app is actually running on your phone (iPhones have a bad habit of
        removing programs from memory sometimes).
        If you have restarted the app on the watch, have verified the Fitbit app is running on the phone, and that
        the bluetooth connection to the phone is up, then force-quit and restart the Fitbit app on the phone.

        <Text align="left" bold>Direction arrow:</Text>
        A directional arrow appears in the lower-right.  The arrow indicates the difference between
        the current value and the previous value.
        If the current value is the result of a recalibration, the arrow will change to two
        arrows pointing at each other and a vibration notification will occur.

        <Text align="left" bold>Glucose alarms:</Text>
        When a low or high glucose alarm occurs, the alarm can be suppressed for various
        amounts of time.  A graph can also be displayed of the last 24 values.
        
        <Text align="left" bold>Glucose high and low limits:</Text>
        If low and/or high glucose limits are set, then the companion application running
        on the phone will automatically fetch glucose information at set intervals.  If no
        limits are set, then the watch face will trigger fetching information after the
        update interval has expired, but will not do so if the screen is off.  When the screen
        comes back on, the update interval is consulted and a fetch will be initiated, if needed.
        
        <Text align="left" bold>Graph:</Text>
        The graph displays the previous 24 glucose values.  If the watch face has been running 
        long enough to have 24 values, then the graph is displayed immediately.
        If not, it will take a few seconds to retrieve the latest information, the first time.

        <Text align="left" bold>Auto-restart functionality</Text>
        If the watch and phone loose the communication channel for any reason, and if a BG High or BG Low limit
        is set, this is considered to be an important event and is brought to the attention of the wearer.
        If "comm suppression" is currently in effect, such as during the "Quiet Time" configured, or even if
        "comm suppression" for a set time period was set on the watch using the menu item, then the watch will
        try to automatically correct the situation by automatically restarted the watch face.
        If restarting the watch face doesn't result in the communication channel returning, such as if the
        watch and phone are out of bluetooth range or the Fitbit app on the phone is not running, then the
        watch will not auto-restart again.  No further auto-restarts will be attempted until the communication
        channel has been re-acquired and then lost again.

        <Text align="left" bold>Menu items</Text>
        The menu icon on the upper-left of the main screen, brings up a menu of items which should not
        be needed most times.
        
        "redo last alarm" - if you accidentally cleared the last daily alarm
        and simply need to bring it back in order to snooze it instead.

        "snooze comm warnings" - This silences notifications about loss
        of communication between the watch and the phone, as well as other minor events (recalibration, reading an old
        BG value from Nightscout).
        For example, if you are swimming and thus the bluetooth
        connection would be lost while you are in the water, it would be convenient to snooze that warning during
        your swim time.  You will not receive warnings about problems reading BG values.  Note, this also means
        that high and low BG alarms will not happen, since you are not reading BG values while in the water.
        The watch will still try to correct the communication problem by auto-restarting the watch face, but then
        will see that an auto-restart didn't help.  Normally it would then notify you, but suppressing comm warnings
        means the watch will just sit awaiting a correction of the problem, with no notification.
        You can terminate the snooze early by selecting the "Cancel Suppressions" menu item.
        
        "Current Suppressions" - Will list any currently active suppressions or snoozes.
        
        "Cancel Suppressions" - Will cancel all currently active suppressions.  This includes BG high and low
        suppressions as well as "comm" suppressions, but does not affect an alarm snooze.
      </Section>
      <Section title={<Text align="center">Release Notes:</Text>}>
      <Text align="left" bold>1.1</Text>
        <Text>Added long period alarm warnings after "BG difference notification" configuration.</Text>
        <Text>Fixed problem where Comm Warning Suppression would be lost after restart.</Text>
      </Section>

    </Page>
  );

}

registerSettingsPage(HelloWorld);

