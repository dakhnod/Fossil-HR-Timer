identifier := $(shell cat build/app.json | jq -r '.identifier')

source_file := app.js
snapshot_file := build/files/code/${identifier}
tools_dir := $(if $(WATCH_SDK_PATH),$(WATCH_SDK_PATH),../Fossil-HR-SDK/)
package_file := ${identifier}.wapp
package_path := build/${package_file}

adb_target := 192.168.0.192:5555
adb_target_dir := /sdcard/q
adb_target_file := ${adb_target_dir}/${package_file}

.PHONY: all build compile pack push connect install clean

${snapshot_file}: ${source_file}
	mkdir -p build/files/code build/files/config
	jerry-snapshot generate -f '' ${source_file} -o ${snapshot_file}

${package_path}: ${tools_dir}tools/pack.py ${snapshot_file}
	python3 ${tools_dir}tools/pack.py -i build/ -o ${package_path}

compile: ${snapshot_file}
build: ${package_path}

push: ${package_path}
	adb shell mkdir -p ${adb_target_dir} 
	adb push ${package_path} ${adb_target_file}

connect:
	adb connect ${adb_target}

install: ${package_path}
	adb shell am broadcast \
	-a "nodomain.freeyourgadget.gadgetbridge.Q_UPLOAD_FILE" \
	--es EXTRA_HANDLE APP_CODE \
	--es EXTRA_PATH "${adb_target_file}" \
	--ez EXTRA_GENERATE_FILE_HEADER false

clean:
	rm -f build/files/code/*
	rm -f build/*.wapp
