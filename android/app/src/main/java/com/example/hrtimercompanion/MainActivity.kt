package com.example.hrtimercompanion

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import org.json.JSONObject
import java.lang.NumberFormatException

class MainActivity : AppCompatActivity() {
    private val QHYBRID_COMMAND_PUSH_CONFIG = "nodomain.freeyourgadget.gadgetbridge.Q_PUSH_CONFIG"
    private val EXTRA_KEY_CONFIG_JSON = "EXTRA_CONFIG_JSON"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
    }

    private fun initViews() {
        val editSeconds: EditText = findViewById(R.id.edit_seconds)
        val editMinutes: EditText = findViewById(R.id.edit_minutes)
        val editHours: EditText = findViewById(R.id.edit_hours)
        findViewById<Button>(R.id.button_send_to_watch)
            .setOnClickListener {
                var seconds = 0
                var minutes = 0
                var hours = 0

                try {
                    val textSeconds = editSeconds.text.toString()
                    if (textSeconds.isNotEmpty()) {
                        seconds = Integer.parseInt(textSeconds)
                    }

                    val textMinutes = editMinutes.text.toString()
                    if (textMinutes.isNotEmpty()) {
                        minutes = Integer.parseInt(textMinutes)
                    }

                    val textHours = editHours.text.toString()
                    if (textHours.isNotEmpty()) {
                        hours = Integer.parseInt(textHours)
                    }

                    val millisTotal = (seconds + minutes * 60 + hours * 3600) * 1000
                    val data = JSONObject()
                        .put(
                            "push", JSONObject()
                                .put(
                                    "set", JSONObject()
                                        .put("stopwatchApp._.config.auto_start_time", millisTotal)
                                )
                        )
                    Toast.makeText(this, "sending to watch, please reastart timer", Toast.LENGTH_LONG).show()
                    val intent = Intent(QHYBRID_COMMAND_PUSH_CONFIG)
                    intent.putExtra(EXTRA_KEY_CONFIG_JSON, data.toString())
                    sendBroadcast(intent)
                }catch (exception: NumberFormatException){
                    Toast.makeText(this, "excuse me wtf", Toast.LENGTH_SHORT).show()
                    
                }
            }
    }
}