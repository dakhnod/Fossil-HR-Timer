
return {
    node_name: '',
    manifest: {
        timers: ['select_tick', 'timer_tick', 'menu_timeout']
    },
    persist: {
        version: 1,
        data: ['auto_start_time', 'start_immediately']
    },
    config: {},
    timer_end_string: '',
    timer_start: 0,
    timer_time: 0,
    alarm_time: 0,
    stopwatch_time: 0,
    paused_stopwatch_time: 0,
    last_timer_time: 0,
    select_direction: '',
    state: 'dead',
    laps: [],
    last_header_text: '',
    last_displayed_minute: -1,
    title_refers_to_timer: false,
    auto_start_time: 0,
    start_immediately: false,

    handler: function (event, response) { // function 1
        this.wrap_event(event)
        this.wrap_response(response)
        this.state_machine.handle_event(event, response)
    },
    log: function (object, tag) {
        if(tag === undefined){
            req_data(this.node_name, '"type": "log", "node":"' + this.node_name + '", "tag":"", "data":' + JSON.stringify(object), 999999, true)
        }else{
            req_data(this.node_name, '"type": "log", "node":"' + this.node_name + '", "tag":"' + tag +  '", "data":' + JSON.stringify(object), 999999, true)
        }
    },
    wrap_event: function (system_state_update_event) {
        if (system_state_update_event.type === 'system_state_update') {
            system_state_update_event.concerns_this_app = system_state_update_event.de
            system_state_update_event.old_state = system_state_update_event.ze
            system_state_update_event.new_state = system_state_update_event.le
        }
        return system_state_update_event
    },
    draw_display_stopwatch: function (response, full_redraw) {
        var title_string
        if (this.state === 'stopwatch_pause') {
            var time = this.calculate_time(this.paused_stopwatch_time)
            var title_string = localization_snprintf('%.2d:%.2d:%.2d.%.3d', time.hours, time.minutes, time.seconds, time.millis)
        } else {
            var time = this.calculate_time(this.calculate_passed_stopwatch_time())
            var title_string = localization_snprintf('%d hours', time.hours)
        }
        response.draw_screen(
            this.node_name,
            full_redraw,
            {
                json_file: 'timer_layout',
                laps: this.laps,
                title: title_string,
                title_icon: 'icStopwatch'
            }
        )
    },
    draw_display_timer: function (response, full_redraw) {
        var now = this.get_current_time()
        var lapLines = [
            'now: ' + this.pad(String(now.hour), 2) + ':' + this.pad(String(now.minute), 2),
        ]
        if (this.state === 'timer_run') {
            var remaining = this.calculate_time(this.calculate_remaining_timer_time())
            lapLines[1] = this.timer_end_string

            var title_string = localization_snprintf('%d hours', remaining.hours)
            var title_icon = 'icTimer'
        } else if(this.state === 'alarm_select') {
            var title_string = 'Better alarm'
            var title_icon = 'icTimer'
        } else {
            var title_string = this.timer_time === 0 ? 'Better stopwatch' : 'Better timer'
            var title_icon = this.timer_time === 0 ? 'icStopwatch' : 'icTimer'
        }
        response.draw_screen(
            this.node_name,
            full_redraw,
            {
                json_file: 'timer_layout',
                title: title_string,
                title_icon: title_icon,
                laps: lapLines
            }
        )
    },
    calculate_time: function (millis) {
        return {
            millis: millis % 1000,
            seconds: Math.floor(millis / 1000 % 60),
            minutes: Math.floor(millis / 60000 % 60),
            hours: Math.floor(millis / 3600000),
        }
    },
    pad: function(value, length) {
        while(value.length < length) {
            value = ('0' + value)
        }
        return value
    },
    format_time: function (millis) {
        var data = {
            minutes: Math.floor((millis / 60000) % 60),
            hours: Math.floor((millis / 3600000) % 24)
        }
        data.minutes = this.pad(data.minutes, 2)
        data.hours = this.pad(data.hours, 2)

        return data
    },
    wrap_state_machine: function(state_machine) {
        state_machine.set_current_state = state_machine.d
        state_machine.handle_event = state_machine._
        state_machine.get_current_state = function(){
            return state_machine.n
        }

        return state_machine
    },
    get_current_time: function(){
        return common
    },
    wrap_response: function (response) {
        response.move_hands = function (degrees_hour, degrees_minute, relative) {
            response.move = {
                h: degrees_hour,
                m: degrees_minute,
                is_relative: relative
            }
        }
        response.vibrate_pattern = function(type){
            response.vibe = type
        }
        response.vibrate_text_pattern = function(){
            this.vibrate_pattern('text')
        }
        response.vibrate_call_pattern = function(){
            this.vibrate_pattern('call')
        }
        response.go_back = function (kill_app) {
            response.action = {
                type: 'go_back',
                Se: kill_app
            }
        }
        response.go_home = function (kill_app) {
            response.action = {
                type: 'go_home',
                Se: kill_app
            }
        }
        response.draw_screen = function (node_name, full_update, layout_info) {
            response.draw = {
                update_type: full_update ? 'gc4' : 'du4'
            }
            response.draw[node_name] = {
                layout_function: 'layout_parser_json',
                layout_info: layout_info
            }
        }
        response.send_user_class_event = function (event_type) {
            response.send_generic_event({
                type: event_type,
                class: 'user'
            })
        }
        response.emulate_double_tap = function(){
            this.send_user_class_event('double_tap')
        },
        response.send_generic_event = function (event_object) {
            if (response.i == undefined) response.i = []
            response.i.push(event_object)
        }
        response.open_app = function(appName){
            response.action = {
                type: 'open_app',
                node_name: appName,
                class: 'watch_app',
            }
        }
        return response
    },
    calculate_remaining_timer_time: function () {
        return Math.max(this.timer_time - (now() - this.timer_start), 0)
    },
    calculate_passed_stopwatch_time: function () {
        return now() - this.timer_start
    },
    display_time_select: function (response) {
        var time = this.calculate_time(this.timer_time)

        var angle_mins = time.minutes * 6
        var angle_hours = angle_mins
        if (time.hours > 0) {
            angle_hours = time.hours * 30 + (time.minutes / 60) * 30
        }
        response.move_hands(angle_hours, angle_mins, false)
    },
    display_alarm_select: function (response) {
        var time = this.calculate_time(this.alarm_time)

        var angle_mins = time.minutes * 6
        var angle_hours = time.hours * 30 + (time.minutes / 60) * 30
        response.move_hands(angle_hours, angle_mins, false)
    },
    display_time_running: function (response) {
        var millis_to_display
        if (this.state === 'timer_run') {
            millis_to_display = this.calculate_remaining_timer_time()
        } else {
            millis_to_display = this.calculate_passed_stopwatch_time()
        }
        var time = this.calculate_time(millis_to_display)

        var angle_mins = time.seconds * 6
        if (time.minutes === 0) {
            angle_hours = angle_mins
        } else {
            angle_hours = time.minutes * 6 + (time.seconds / 60) * 6
        }
        response.move_hands(angle_hours, angle_mins, false)
    },
    time_select_forward: function (response) {
        var mins = Math.floor(this.timer_time / (60 * 1000))
        if (mins % 5 == 0) mins += 5
        else mins += 5 - (mins % 5)
        this.timer_time = mins * 60 * 1000
        this.display_time_select(response)
    },
    start_forward_timer: function () {
        start_timer(this.node_name, 'select_tick', 150)
    },
    start_timer_tick_timer: function () {
        var timeout = 0
        if (this.state === 'stopwatch_run') {
            timeout = 1000 - (this.calculate_passed_stopwatch_time() % 1000)
        } else {
            timeout = this.calculate_remaining_timer_time() % 1000
        }
        if (timeout === 0) timeout = 1000
        start_timer(this.node_name, 'timer_tick', timeout)
    },
    play_notification: function (response) {
        response.send_generic_event({
            type: 'urgent_notification_new',
            info: {
                title: localization_snprintf('%s', 'Brr Brr'),
                app_name: this.package_name,
                icon_name: 'icTimer',
                Re: 60, // timeout in secs for notification
                vibe: {
                    type: 'text',
                    interval_ms: 1500,
                    duration_ms: 60000,
                },
                exit_event: {
                    type: 'timer_dismiss'
                },
                actions: [
                    {
                        Ke: localization_snprintf('%s', 'Dismiss'),
                        event: {
                            type: 'timer_dismiss'
                        }
                    },
                    {
                        Ke: localization_snprintf('%s', 'Repeat'),
                        event: {
                            type: 'timer_restart'
                        }
                    }
                ]
            }
        })
        response.send_generic_event({
            type: 'urgent_notification',
            info: {
                title: localization_snprintf('%s', 'Brr Brr'),
                app_name: this.package_name,
                icon_name: 'icTimer',
                Re: 60, // timeout in secs for notification
                vibe: {
                    type: 'timer',
                    Te: 1500,
                    Ie: 60000
                },
                exit_event: {
                    type: 'timer_dismiss'
                },
                actions: [
                    {
                        Ke: localization_snprintf('%s', 'Dismiss'),
                        event: {
                            type: 'timer_dismiss'
                        }
                    },
                    {
                        Ke: localization_snprintf('%s', 'Repeat'),
                        event: {
                            type: 'timer_restart'
                        }
                    }
                ]
            }
        })
    },
    check_timer_time: function (response) {
        if (this.state === 'timer_run') {
            var remaining = this.calculate_remaining_timer_time()
            if (remaining <= 0) {
                this.play_notification(response)
                // reset timer
                this.last_timer_time = this.timer_time
                this.timer_time = 0
                if (this.state_machine.get_current_state() === 'background') {
                    this.state = 'timer_select'
                } else {
                    this.state_machine.set_current_state('timer_select')
                }
                return
            }
        }

        this.start_timer_tick_timer()
    },
    timer_stopwatch_start: function(self, response){
        self.timer_start = now()
        self.start_timer_tick_timer()
        self.last_displayed_minute = 0
        if (self.timer_time == 0) {
            self.laps.splice(0)
            self.state_machine.set_current_state('stopwatch_run')
        } else {
            self.state_machine.set_current_state('timer_run')
        }
    },
    handle_global_event: function (self, state_machine, event, response) {
        if (event.type === 'system_state_update' && event.concerns_this_app === true) {
            if (event.new_state === 'visible') {
                if(self.state == 'dead'){
                    self.timer_time = self.auto_start_time
                    if(self.start_immediately){
                        self.timer_stopwatch_start(self, response)
                    }else{
                        state_machine.set_current_state('timer_select')
                    }
                }else{
                    self.state_machine.set_current_state(self.state)
                }
            } else {
                state_machine.set_current_state('background')
            }
        } else if (event.type === 'middle_hold') {
            response.go_back(self.state == 'timer_select' ||  self.state == 'alarm_select')
        } else if (event.type === 'timer_restart') {
            self.timer_time = self.last_timer_time
            self.timer_start = now()
            self.start_timer_tick_timer()
            if (state_machine.get_current_state !== 'background') {
                state_machine.set_current_state('timer_run')
            } else {
                self.state = 'timer_run'
            }
        } else if (event.type === 'timer_dismiss') {
            response.go_back(true)
        } else if (event.type == 'node_config_update' && event.node_name == self.node_name){
            var save_config = false
            if(typeof(self.config.auto_start_time) !== 'undefined'){
                self.auto_start_time = self.config.auto_start_time
                self.config.auto_start_time = undefined
                save_config = true

                if(self.state == 'timer_select'){
                    self.timer_time = self.auto_start_time
                    self.draw_display_timer(response, true)
                    self.display_time_select(response)
                }
            }
            if(typeof(self.config.start_immediately) !== 'undefined'){
                self.start_immediately = self.config.start_immediately
                self.config.start_immediately = undefined
                save_config = true
            }
            if(typeof(self.config.timer_start) == 'object') {
                self.timer_time = self.config.timer_start.millis

                if(typeof(self.config.timer_start.millis_end) == 'number') {
                    self.timer_time = self.config.timer_start.millis_end - (get_unix_time() * 1000)
                    while(self.timer_time <= 0) {
                        self.timer_time += 86400000
                    }
                }

                if(self.timer_time == undefined) {
                    return
                }

                self.timer_stopwatch_start(self, response)
                self.state = 'timer_run'
                if(self.config.timer_start.background === true && state_machine.get_current_state() == 'background'){
                    state_machine.set_current_state('background')
                }else{
                    response.open_app('stopwatchApp')
                }
                self.config.timer_start = undefined
            }

            if(save_config){
                save_node_persist(self.node_name)
            }
        }
    },
    handle_state_specific_event: function (state, state_phase) {
        switch (state) {
            case 'background': {
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {
                        type = event.type
                        if (type === 'timer_expired') {
                            if (is_this_timer_expired(event, self.node_name, 'timer_tick')) {
                                self.check_timer_time(response)
                            }
                        }
                    }
                }
                break;
            }
            case 'timer_select': {
                if (state_phase == 'entry') {
                    return function (self, response) {
                        self.state = 'timer_select'
                        self.draw_display_timer(response, true)
                        self.display_time_select(response)
                        start_timer(self.node_name, 'menu_timeout', 30000)
                    }
                }
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {
                        type = event.type

                        if(event.class == 'user'){
                            stop_timer(self.node_name, 'menu_timeout')
                        }

                        if (type === 'middle_short_press_release') {
                            self.timer_stopwatch_start(self, response)
                        } else if (type === 'top_press') {
                            if (self.timer_time > 0) {
                                self.timer_time -= 60 * 1000
                                if (self.timer_time < 0) self.timer_time = 0
                                self.display_time_select(response)
                            }else{
                                self.state_machine.set_current_state('alarm_select')
                                return
                            }
                        } else if (type === 'top_hold') {
                            self.timer_time = 0
                            self.display_time_select(response)
                        } else if (type === 'bottom_press') {
                            self.time_select_forward(response)
                        } else if (type === 'bottom_hold') {
                            self.time_select_forward(response)
                            self.select_direction = 'forward'
                            self.start_forward_timer()
                        } else if (type === 'timer_expired') {
                            if (is_this_timer_expired(event, self.node_name, 'select_tick')) {
                                if (self.select_direction === 'forward') {
                                    self.time_select_forward(response)
                                    self.start_forward_timer()
                                }
                            } else if (is_this_timer_expired(event, self.node_name, 'menu_timeout')) {
                                response.go_back(true)
                            }
                        } else if (type === 'bottom_long_press_release') {
                            self.select_direction = ''
                            stop_timer(self.node_name, 'select_tick')
                        }
                        if (
                            type === 'top_short_press_release'
                            || type === 'bottom_short_press_release'
                            || type === 'top_long_press_release'
                            || type === 'bottom_long_press_release'
                        ) {
                            var title_should_refer_to_timer = self.timer_time > 0
                            if (self.title_refers_to_timer != title_should_refer_to_timer) {
                                self.draw_display_timer(response, false)
                                self.title_refers_to_timer = title_should_refer_to_timer
                            }
                        }
                    }
                }
                if (state_phase == 'exit') {
                    return function (arg, arg2) { // function 14, 20

                    }
                }
                break;
            }
            case 'alarm_select': {
                if (state_phase == 'entry') {
                    return function (self, response) {
                        self.state = 'alarm_select';

                        var now = self.get_current_time();
                        self.alarm_time = now.hour % 12 * 3600 + now.minute * 60;
                        self.alarm_time *= 1000; // convert seconds to millis

                        self.draw_display_timer(response, true)
                        self.display_alarm_select(response)
                    }
                }
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {
                        type = event.type
                        if (type === 'middle_short_press_release') {
                            self.last_displayed_minute = -1
                            var now_millis = (get_unix_time() + (common.time_zone_local * 60)) * 1000
                            now_millis %= 12 * 60 * 60 * 1000
                            var time_dif = self.alarm_time - now_millis
                            if(time_dif < 0) time_dif += 12 * 60 * 60 * 1000
                            self.timer_time = time_dif
                            
                            self.timer_start = now()
                            self.start_timer_tick_timer()
                            self.state_machine.set_current_state('timer_run')
                        } else if (type === 'top_press') {
                            self.alarm_time -= 60 * 1000
                            if(self.alarm_time < 0){
                                self.alarm_time += 12 * 60 * 60 * 1000
                            }
                            self.display_alarm_select(response)
                        } else if (type === 'top_hold') {
                            // self.time_select_forward(response)
                            self.alarm_time -= (self.alarm_time % (5 *  60 * 1000))
                            self.select_direction = 'backward'
                            self.start_forward_timer()
                        } else if (type === 'bottom_press') {
                            self.alarm_time += 60 * 1000
                            self.alarm_time %= 12 * 60 * 60 * 1000
                            self.display_alarm_select(response)
                        } else if (type === 'bottom_hold') {
                            // self.time_select_forward(response)
                            self.alarm_time += (5 *  60 * 1000) - (self.alarm_time % (5 *  60 * 1000))
                            self.select_direction = 'forward'
                            self.start_forward_timer()
                        } else if (type === 'timer_expired') {
                            if (is_this_timer_expired(event, self.node_name, 'select_tick')) {
                                if (self.select_direction == 'forward') {
                                    self.alarm_time += 5 * 60 * 1000
                                    self.alarm_time %= 12 * 60 * 60 * 1000
                                }else if(self.select_direction == 'backward') {
                                    self.alarm_time -= 5 * 60 * 1000
                                    if(self.alarm_time < 0){
                                        self.alarm_time += 12 * 60 * 60 * 1000
                                    }
                                }
                                self.display_alarm_select(response)
                                self.start_forward_timer()
                            }
                        } else if (type == 'bottom_long_press_release' || type == 'top_long_press_release') {
                            self.select_direction = ''
                            stop_timer(self.node_name, 'select_tick')
                        }
                    }
                }
                if (state_phase == 'exit') {
                    return function (arg, arg2) { // function 14, 20

                    }
                }
                break;
            }
            case 'stopwatch_run': {
                if (state_phase == 'entry') {
                    return function (self, response) {
                        self.state = state
                        self.display_time_running(response)
                        self.draw_display_stopwatch(response, true)
                    }
                }
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {
                        type = event.type
                        if (type === 'middle_short_press_release') {
                            stop_timer(self.node_name, 'timer_tick')
                            state_machine.set_current_state('stopwatch_pause')
                        } else if (type === 'timer_expired') {
                            if (is_this_timer_expired(event, self.node_name, 'timer_tick')) {
                                self.check_timer_time(response)
                                self.display_time_running(response)

                                var time = self.calculate_time(self.calculate_passed_stopwatch_time())
                                if (time.minutes != self.last_displayed_minute) {
                                    if (time.minutes == 0) {
                                        self.draw_display_stopwatch(response, false)
                                    }
                                    self.last_displayed_minute = time.minutes
                                }
                            }
                        } else if (type === 'top_short_press_release') {
                            self.timer_start = now()
                            stop_timer(self.node_name, 'timer_tick')
                            self.start_timer_tick_timer()
                            self.display_time_running(response)
                            self.laps.splice(0)
                            self.draw_display_stopwatch(response, true)
                        } else if (type === 'bottom_press') {
                            var passed = now() - self.timer_start
                            passed = self.calculate_time(passed)
                            passed = localization_snprintf('%.2d:%.2d:%.2d.%.3d', passed.hours, passed.minutes, passed.seconds, passed.millis)
                            self.laps.splice(0, 0, passed)
                            self.laps.splice(4)
                            self.draw_display_stopwatch(response, false)
                        }
                    }
                }
                if (state_phase == 'exit') {
                    return function (arg, arg2) { // function 14, 20

                    }
                }
                break
            }
            case 'timer_run': {
                if (state_phase == 'entry') {
                    return function (self, response) {
                        self.state = state

                        var currentTime = self.get_current_time()
                        // convert to timestamp
                        currentTime = (currentTime.hour * 3600000) + (currentTime.minute * 60000)
                        var endTimestamp = currentTime + self.timer_time
                        var endTimestamp = self.format_time(endTimestamp)
                        self.timer_end_string = 'end: ' + endTimestamp.hours + ':' + endTimestamp.minutes

                        self.display_time_running(response)
                        self.draw_display_timer(response, true)
                    }
                }
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {
                        type = event.type
                        if (type === 'middle_short_press_release') {
                            stop_timer(self.node_name, 'timer_tick')
                            self.timer_time -= self.timer_time % (60 * 1000)
                            state_machine.set_current_state('timer_select')
                        } else if (type === 'timer_expired') {
                            if (is_this_timer_expired(event, self.node_name, 'timer_tick')) {
                                self.check_timer_time(response)
                                self.display_time_running(response)

                                var time = self.calculate_time(self.calculate_remaining_timer_time())
                                if (time.minutes != self.last_displayed_minute) {
                                    self.draw_display_timer(response, (time.minutes % 5) == 0)
                                    self.last_displayed_minute = time.minutes
                                }

                            }
                        } else if (type === 'time_telling_update') {
                            var now = self.get_current_time()
                            self.draw_display_timer()
                        } else if (type === 'bottom_short_press_release') {
                            self.timer_start += 60 * 1000
                            self.display_time_running(response)
                        } else if (type === 'top_short_press_release') {
                            self.timer_start -= 60 * 1000
                            self.display_time_running(response)
                        }
                    }
                }
                if (state_phase == 'exit') {
                    return function (arg, arg2) { // function 14, 20

                    }
                }
                break
            }
            case 'stopwatch_pause': {
                if (state_phase == 'entry') {
                    return function (self, response) {
                        if(self.state != 'stopwatch_pause'){
                            self.paused_stopwatch_time = now() - self.timer_start
                        }
                        self.state = state
                        self.stopwatch_time = self.paused_stopwatch_time
                        self.display_time_running(response)
                        self.draw_display_stopwatch(response, true)
                        response.move_hands(270, 90, false)
                    }
                }
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {
                        type = event.type
                        if (type === 'middle_short_press_release') {
                            self.timer_start = now() - self.stopwatch_time
                            self.start_timer_tick_timer()
                            self.state_machine.set_current_state('stopwatch_run')
                        } else if (type === 'top_short_press_release' || type == 'bottom_short_press_release') {
                            self.timer_time = 0
                            self.state_machine.set_current_state('timer_select')
                        }
                    }
                }
                if (state_phase == 'exit') {
                    return function (arg, arg2) { // function 14, 20

                    }
                }
                break
            }
        }
        return
    },
    init: function () { // function 8
        this.state_machine = new state_machine(
            this,
            this.handle_global_event,
            this.handle_state_specific_event,
            undefined,
            'background'
        )
        this.wrap_state_machine(this.state_machine)
    }
}
