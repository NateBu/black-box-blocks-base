RUN apt-get install -y texinfo wget libreadline-dev
RUN wget http://ftp.gnu.org/gnu/gdb/gdb-8.1.tar.xz
RUN tar -xf gdb-8.1.tar.xz
WORKDIR gdb-8.1/
RUN ./configure --prefix=/usr/local --with-python=/usr/bin/python3 --with-system-readline --without-guile && make -j8
RUN make -C gdb install
RUN cd .. && rm -r gdb-8.1 && rm -r gdb-8.1.tar.xz