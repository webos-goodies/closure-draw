#! /usr/bin/ruby
# -*- coding: utf-8 -*-

require 'webrick'

PID_FILE = './server.pid'

$server = nil

def shutdown
  File.delete(PID_FILE)
  $server.shutdown
end

def start
  if File.exist?(PID_FILE)
    $stderr << "#{PID_FILE} is exist.\n"
    exit(1)
  end
  current_dir = Dir.pwd
  WEBrick::Daemon.start do
    Dir.chdir(current_dir) do
      File.open(PID_FILE, 'w'){|file| file << $$.to_s }
      $server = WEBrick::HTTPServer.new(:DocumentRoot => './', :Port => 3000)
      Signal.trap('INT'){ shutdown }
      Signal.trap('TERM'){ shutdown }
      $server.start
    end
  end
end

def stop
  pid = nil
  begin
    File.open(PID_FILE, 'r'){|file| pid = file.read.to_i }
  rescue
    $stderr << "#{PID_FILE} is not exist.\n"
    exit(2)
  end
  Process.kill('TERM', pid)
end

case ARGV[0]
when 'start' then start
when 'stop'  then stop
else              print "Usage : server <start|stop>\n"
end
