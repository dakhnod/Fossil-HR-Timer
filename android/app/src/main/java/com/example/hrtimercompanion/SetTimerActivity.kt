package com.example.hrtimercompanion

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.text.format.DateFormat
import android.util.Log
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.CheckBox
import android.widget.ListView
import org.json.JSONObject
import java.util.*
import java.util.regex.Pattern
import kotlin.collections.ArrayList

class SetTimerActivity : AppCompatActivity(), AdapterView.OnItemClickListener {
    private val TAG = "SetTimerActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_set_timer)

        handleExtraText()

        // handleTimeString("free at 2:00? or maybe 11:45? how about in 26 Minutes?")
    }

    private fun handleExtraText(){
        val text = intent.getStringExtra("android.intent.extra.TEXT") ?: return
        handleTimeString(text)
    }

    override fun onItemClick(p0: AdapterView<*>?, p1: View?, p2: Int, p3: Long) {
        if(p0 == null){
            return
        }
        val target = p0.getItemAtPosition(p2) as TimerTarget
        Log.d(TAG, "onItemClick: " + target)
        val millis = target.getCountdownMillis()

        val data = JSONObject()
            .put(
                "push", JSONObject()
                    .put(
                        "set", JSONObject()
                            .put("stopwatchApp._.config.timer_start", JSONObject()
                                .put("millis", millis)
                            )
                    )
            )

        val intent = Intent(MainActivity.QHYBRID_COMMAND_PUSH_CONFIG)
        intent.`package` = MainActivity.BROADCAST_PACKAGE
        intent.putExtra(MainActivity.EXTRA_KEY_CONFIG_JSON, data.toString())
        sendBroadcast(intent)

        finish()
    }

    private fun handleTimeString(textConst: String){
        var text = textConst

        var pattern = Pattern.compile("([0-9]{1,2}):([0-9]{1,2})")
        var matches = pattern.matcher(text)

        val timerTargets = ArrayList<TimerTarget>()

        while(matches.find()) {
            if(matches.groupCount() != 2){
                continue
            }

            val prefix = Integer.parseInt(matches.group(1) as String)
            val postfix = Integer.parseInt(matches.group(2) as String)
            // val timeInMinutesSeconds = (prefix * 60) + (postfix)
            val timeInHoursSeconds = (prefix * 3600) + (postfix * 60)
            timerTargets.add(AbsoluteTimerTarget((timeInHoursSeconds * 1000).toLong()))

            if(prefix < 13){
                val timeInHoursSeconds2 = ((prefix + 12) * 3600) + (postfix * 60)
                timerTargets.add(AbsoluteTimerTarget((timeInHoursSeconds2 * 1000).toLong()))
            }

            text = text.replace(matches.group(), "")
        }

        pattern = Pattern.compile("(?=[^:])[0-9]+(?<=[^:])")
        matches = pattern.matcher(text)

        while(matches.find()){
            val number = Integer.parseInt(matches.group() as String)
            timerTargets.add(RelativeMinutesTimerTarget(number.toLong()))
            timerTargets.add(RelativeHoursTimerTarget(number.toLong()))
        }

        Log.d(TAG, "handleTimeString: ")

        val listView = findViewById<ListView>(R.id.list_timer_targets)

        listView.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, timerTargets)
        listView.onItemClickListener = this
    }

    abstract class TimerTarget {
        abstract fun getDescription(): String

        abstract fun getCountdownMillis(): Long

        override fun toString(): String {
            return getDescription()
        }
    }

    open class RelativeMillisTimerTarget(private val timerMillis: Long) : TimerTarget() {
        override fun getDescription(): String {
            return "in %d millis".format(timerMillis)
        }

        override fun getCountdownMillis(): Long {
            return timerMillis
        }
    }

    open class RelativeSecondsTimerTarget(private val timerSeconds: Long): RelativeMillisTimerTarget(timerSeconds * 1000) {
        override fun getDescription(): String {
            return "in %d seconds".format(timerSeconds)
        }
    }

    open class RelativeMinutesTimerTarget(private val timerMinutes: Long): RelativeSecondsTimerTarget(timerMinutes * 60) {
        override fun getDescription(): String {
            return "in %d minutes".format(timerMinutes)
        }
    }

    open class RelativeHoursTimerTarget(private val timerHours: Long): RelativeMinutesTimerTarget(timerHours * 60) {
        override fun getDescription(): String {
            return "in %d hours".format(timerHours)
        }
    }

    class AbsoluteTimerTarget(private val timestampInFuture: Long): TimerTarget() {
        override fun getDescription(): String {
            val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
            calendar.timeInMillis = timestampInFuture
            return "at %s".format(DateFormat.format("H:mm", calendar))
        }

        override fun getCountdownMillis(): Long {
            val calendar = Calendar.getInstance()
            var now = System.currentTimeMillis()
            now += calendar.get(Calendar.ZONE_OFFSET)
            now += calendar.get(Calendar.DST_OFFSET)
            now %= 86400000
            var dif = timestampInFuture - now

            if(dif < 0){
                dif += 86400000
            }
            return dif
        }

    }
}