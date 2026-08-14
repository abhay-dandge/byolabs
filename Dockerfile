FROM ubuntu:24.04

RUN apt-get update && \
    apt-get install -y openssh-server sudo && \
    mkdir /run/sshd && \
    useradd -m -s /bin/bash abhay && \
    echo 'abhay:abhay' | chpasswd && \
    echo 'abhay ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

EXPOSE 22

CMD ["/usr/sbin/sshd", "-D"]
