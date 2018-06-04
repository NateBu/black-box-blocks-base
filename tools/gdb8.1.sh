DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
apt-get install -y texinfo wget libreadline-dev
wget http://ftp.gnu.org/gnu/gdb/gdb-8.1.tar.xz
tar -xf gdb-8.1.tar.xz
cd gdb-8.1/
./configure --prefix=$DIR --with-python=/usr/bin/python3 --with-system-readline --without-guile && make -j8
make -C gdb install
cp -r gdb/data-directory/* ..
cd ..
rm -r gdb-8.1
rm -r gdb-8.1.tar.gz