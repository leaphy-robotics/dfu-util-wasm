rm -rf build_assets build

mkdir build_assets && cd build_assets
git clone https://github.com/libusb/libusb --depth 1
git clone git://git.code.sf.net/p/dfu-util/dfu-util --depth 1

SOURCE=$(realpath .)

cd libusb
autoreconf -fiv
emconfigure ./configure --host=wasm32-emscripten --prefix=${SOURCE}/libusb/build
emmake make install

cd ${SOURCE}/dfu-util
autoreconf -fiv
emconfigure ./configure USB_CFLAGS="-I${SOURCE}/libusb/build/include/libusb-1.0" USB_LIBS="-L ${SOURCE}/libusb/build/lib -lusb-1.0" LDFLAGS="--bind -s ASYNCIFY -s ALLOW_MEMORY_GROWTH -s INVOKE_RUN=0 -s EXPORTED_RUNTIME_METHODS=['callMain','FS'] -pthread -mbulk-memory -O1 -s EXPORT_ES6 -s MODULARIZE=1" CFLAGS="-pthread -mbulk-memory -O1 -sFORCE_FILESYSTEM" --host=wasm32-emscripten
emmake make -j8

cd ${SOURCE}
mkdir ../build
cp dfu-util/src/dfu-util ../build/dfu-util.js
cp dfu-util/src/{dfu-util.wasm,dfu-util.worker.mjs} ../build
