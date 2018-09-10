'''
TODO: USe this for all STL https://gist.github.com/skyscribe/3978082
gdb --batch-silent -x thing_gdb_commands.py --args executablename arg1 arg2 arg3
//vygdb {"action":"variable_message","variable":"dividers","topic":"VineyardRowGenerator::generateRows::dividers"}
https://gcc.gnu.org/ml/libstdc++/2009-02/msg00056.html

print([gdb.TYPE_CODE_PTR,  gdb.TYPE_CODE_ARRAY,     gdb.TYPE_CODE_STRUCT,  gdb.TYPE_CODE_UNION,
  gdb.TYPE_CODE_ENUM,      gdb.TYPE_CODE_FLAGS,     gdb.TYPE_CODE_FUNC,    gdb.TYPE_CODE_INT,
  gdb.TYPE_CODE_FLT,       gdb.TYPE_CODE_VOID,      gdb.TYPE_CODE_SET,     gdb.TYPE_CODE_RANGE,
  gdb.TYPE_CODE_STRING,    gdb.TYPE_CODE_BITSTRING, gdb.TYPE_CODE_ERROR,   gdb.TYPE_CODE_METHOD,
  gdb.TYPE_CODE_METHODPTR, gdb.TYPE_CODE_MEMBERPTR, gdb.TYPE_CODE_REF,     gdb.TYPE_CODE_CHAR,
  gdb.TYPE_CODE_BOOL,      gdb.TYPE_CODE_COMPLEX,   gdb.TYPE_CODE_TYPEDEF, gdb.TYPE_CODE_NAMESPACE,
  gdb.TYPE_CODE_DECFLOAT,  gdb.TYPE_CODE_INTERNAL_FUNCTION])

'''
import gdb, time, re, json, math, sys, subprocess, os
from multiprocessing.connection import Client
from multiprocessing import Queue
import threading
global SOCK, VYGDB
SOCK = None
VYGDB = {'METHODS':{},'MARSHALS':{},'BREAKPOINTS':[]}
user_command = Queue()

class ParseSourceException(Exception):
    pass

class _iterator:
  def __init__ (self, start, finish):
    self.item = start
    self.finish = finish
    self.count = 0

  def __iter__(self):
    return self

  def next(self):
    if self.item == self.finish:
      raise StopIteration
    count = self.count
    self.count = self.count + 1
    elt = self.item.dereference()
    self.item = self.item + 1
    return elt

def _vector(variable):
  first = variable['_M_impl']['_M_start']
  last = variable['_M_impl']['_M_finish']
  lngth = int(last-first)
  it = _iterator(first, last)
  x = []
  count = 0
  while count < lngth:
    try:
      x.append(marshal( it.next() ))
    except Exception as exc:
      print('vygdb._vector exception:',exc)
      sys.stdout.flush()
      break
    count += 1
  return x

def _tuple(head):
  # https://gcc.gnu.org/ml/libstdc++/2009-10/msg00102.html
  nodes = head.type.fields () # should be length 1
  head = head.cast (nodes[0].type)
  x = []
  count = 0
  while head is not None:
    nodes = head.type.fields()  # should be length 2
    impl = head.cast (nodes[-1].type)  # Right node is the actual class contained in the tuple.
    head = None if len(nodes)<2 else head.cast (nodes[0].type) # Left node is the next recursion parent, set it as head.
    fields = impl.type.fields ()
    if len (fields) < 1 or fields[0].name != "_M_head_impl":
        pass # I dont know what to do here
    else:
        x.append(marshal(impl['_M_head_impl']))
    count += 1
  return x

def _struct(variable):
  fields = []
  for field in variable.type.fields():
    if not (field.artificial or field.name is None):
      fields.append(field.name)
  isstring = all([field in ['_M_dataplus','_M_string_length','npos'] for field in fields])
  if len(fields) == 0 or isstring:
    try:
      if isstring:
        l = variable['_M_string_length']
        x = str(variable['_M_dataplus']['_M_p'].string (length = l))
      else:
        x = str(variable)
    except Exception as exc:
      x = str(variable)
  else:
    x = {}
    for name in fields:
      x[name] = marshal(variable[name])
  return x

def marshal(variable):
  typ = variable.type
  if typ.code == gdb.TYPE_CODE_TYPEDEF:
    typ = typ.strip_typedefs() 
  vtype = str(typ)
  x = None
  try:
    if typ.code in [gdb.TYPE_CODE_REF]:
      x = marshal(variable.referenced_value())
    elif typ.code in [gdb.TYPE_CODE_PTR]:
      x = marshal(variable.dereference())
    elif typ.code == gdb.TYPE_CODE_VOID:
      x = None
    elif vtype.find("const std::vector") == 0 or vtype.find("std::vector") == 0:
      x = _vector(variable)
    elif vtype.find("const std::tuple") == 0 or vtype.find("std::tuple") == 0:
      x = _tuple(variable)
    elif vtype.find("const std::function") == 0 or vtype.find("std::function") == 0:
      x = None
    elif vtype.find("const std::map") == 0 or vtype.find("std::map") == 0:
      x = _map(variable)
    elif vtype.find("const std::allocator") == 0 or vtype.find("std::allocator") == 0:
      x = _map(variable)
    elif typ.code == gdb.TYPE_CODE_FLT:
      x = float(variable)
      if math.isnan(x):
        x = None
    elif typ.code == gdb.TYPE_CODE_INT:
      x = int(variable)
    elif typ.code == gdb.TYPE_CODE_BOOL:
      x = bool(variable)
    elif typ.code in [gdb.TYPE_CODE_ENUM]:
      x = '"'+str(variable)+'"' # enums return as string not value
    elif vtype in VYGDB['MARSHALS']:
      x = VYGDB['MARSHALS'][vtype](variable,marshal)
    else:
      x = _struct(variable)
  except Exception as exc:
    print('vygdb.marshal Exception = ',exc)
    print('vtype = ',vtype)
    print('typ.code = ',typ.code)
    print('variable = ',variable)
    sys.stdout.flush()
  return x

class custom_breakpoint(gdb.Breakpoint):
  def __init__(self, source, action):
    gdb.Breakpoint.__init__(self, source)
    self.source = source
    self.variables = action['variables'] if 'variables' in action else []
    self.topic = action['topic'] if 'topic' in action else None
    self.method = action['method'] if 'method' in action else None
    self.breakstop = action['stop'] if 'stop' in action else False
    self.action = action

  def stop(self):
    msg = {}
    for variablemap in self.variables:
      try:
        msg[variablemap] = marshal(gdb.parse_and_eval(self.variables[variablemap]))
      except Exception as exc:
        print('vygdb.custom_breakpoint error: Could not access variable ' + self.variables[variablemap] + ' at ' + self.source + '\n', exc)
        sys.stdout.flush()
        return True

    stop_ = self.breakstop
    if msg and self.topic is None and self.method is None: # No topic or method just print
      for x in msg:
        print(x+':',msg[x])
      sys.stdout.flush()

    if self.method is not None and self.method in VYGDB['METHODS']:
      try:
        stop_ |= VYGDB['METHODS'][self.method](msg, {'queue':user_command, 'gdb':gdb, 'marshal':marshal})
      except Exception as exc:
        print('vygdb.custom_breakpoint error: Problem running method ' + str(self.method) + ' at ' + self.source + '\n', exc)
        sys.stdout.flush()
        return True

    if msg and self.topic is not None:
      data = {}
      for x in self.action:
        if x is not 'breakpoint':
          data[x] = msg if x == 'variables' else self.action[x]
      try:
        SOCK.send({'vygdb_data':data})
      except Exception as exc:
        print('Failed to send vygdb_data',data)
        print(exc)
        sys.stdout.flush()
        return True
    return stop_

def exit_handler (event):
  gdb.execute("quit")

def activate(filterlist=[], exclusive=False):
  __action_assignment__(filterlist, True, exclusive)

def deactivate(filterlist=[], exclusive=False):
  __action_assignment__(filterlist, False, exclusive)

def __action_assignment__(filterlist=[], default_active=True, exclusive=True):
  global VYGDB
  def _addaction_(action, make_active):
    if 'source' in action:
      if 'breakpoint' in action and not make_active:
        action['breakpoint'].delete()
        del action['breakpoint']
      elif 'breakpoint' not in action and make_active:
        action['breakpoint'] = custom_breakpoint(action['source'],action)
    else:
      print('vygdb Action:',action,'must have "source" ["variables", "topic", "labels", and "method" are optional fields]')
      sys.stdout.flush()

  for action in VYGDB['BREAKPOINTS']:
    match = ('labels' in action and (not set(action['labels']).isdisjoint(filterlist)))
    match = match if not exclusive else not match
    if match:
      _addaction_(action, default_active)

def marshals_and_methods(textlist):
  global VYGDB
  for text in textlist:
    tempvygdb = {'MARSHALS':{},'METHODS':{}}
    exec(text, {}, tempvygdb)
    for typ in ['MARSHALS','METHODS']:
      for x in tempvygdb[typ]:
        print('Adding ',typ,x)
        if x in VYGDB[typ]:
          raise ParseSourceException("Duplicate "+typ+" definition of "+typ+'"')
        VYGDB[typ][x] = tempvygdb[typ][x]

def parse_sources(replace_paths=[]):
  global VYGDB
  sources = gdb.execute("info sources",to_string=True)
  pattern1 = 'Source files for which symbols have been read in:'
  pattern2 = 'Source files for which symbols will be read in on demand:'
  p1s = sources.find(pattern1)
  p2s = sources.find(pattern2)
  vyscripts = []
  if p1s >= 0 and p2s >=0 :
    symbols = sources[p1s+len(pattern1):p2s].strip().split(', ') + sources[p2s+len(pattern2):].strip().split(', ')
    for filename in symbols:
      for rpath in replace_paths:
        filename = filename.replace(rpath['old'],rpath['new'])

      delimiter = re.compile('(?s)<vygdb(.*?)vygdb>')
      try:
        with open(filename, 'r') as file:
          vyscripts += delimiter.findall(file.read())

        with open(filename, 'r') as file:
          for (i, line) in enumerate(file):
            for mtch in delimiter.findall(line):
              try:
                cmd = json.loads(mtch)
                cmd['source'] = filename.split('/')[-1]+':'+str(i+1)
                for c in VYGDB['BREAKPOINTS']:
                  if cmd['source']==c['source']:
                    raise ParseSourceException("Duplicate source breakpoint")
                VYGDB['BREAKPOINTS'].append(cmd)
              except Exception as exc:
                print('  vygdb.parse_sources: Could not process potential debug point in '+filename+' at line '+str(i)+':\n'+line,exc)
                sys.stdout.flush()
      except Exception as exc:
        print('  vygdb.parse_sources: collection warning, failed reading of '+filename+':',exc)
        sys.stdout.flush()
  
  vyscripts_filter_breakpoints = []
  for x in vyscripts:
    try:
      json.loads(x)
    except:
      vyscripts_filter_breakpoints.append(x)
  return vyscripts_filter_breakpoints

def get_command():
  cmd = user_command.get()
  if cmd.startswith('v '):
    try:
      print(gdb.parse_and_eval(cmd[2:]))
    except Exception as exc:
      print(exc)
    sys.stdout.flush()
    cmd = None
  elif cmd.startswith('activate '):
    lst = cmd.strip().split()[1:]
    activate(lst, False)
    cmd = None
  elif cmd.startswith('deactivate '):
    lst = cmd.strip().split()[1:]
    deactivate(lst, False)
    cmd = None
  return cmd

def latest_position(sock, lastfile):
  currentfile = None
  try:
    # I'm sure there's a better way of getting linenumber and file from gdb class but I can't figure it out
    x = gdb.newest_frame().find_sal()
    if x is not None and x.is_valid() and x.symtab.is_valid():
      currentfile = x.symtab.filename
      if currentfile is not lastfile:
        with open(currentfile,'r') as cf:
          sock.send({'vygdb_current':{'line':x.line,'filename':currentfile,'file':cf.read(),'job':os.environ['VYJOB']}})
      else:
        sock.send({'vygdb_current':{'line':x.line,'job':os.environ['VYJOB']}})
  except Exception as exc:
    print('vygdb latest_position error:',exc)
    sys.stdout.flush()
  return currentfile

def stop(msg, user_command):
  return True

if __name__ == '__main__':
  replace_paths = []

  gdb.events.exited.connect(exit_handler)
  #gdb.execute("start") # Ensure shared libraries are loaded already (TODO, fix this? try-catch?)
  gdb.execute("set pagination off")
  gdb.execute("set python print-stack full")
  gdb.execute("set confirm off")
  vyscripts = parse_sources(replace_paths)

  def cmd_listener():
    while True:
      data = SOCK.recv()
      if data and 'vygdb' in data:
        user_command.put( data['vygdb'] )   

  host = 'docker.host.internal'
  # Since docker.host.internal is broken on linux (https://github.com/docker/for-linux/issues/264)
  host = subprocess.check_output("/sbin/ip route|awk '/default/ { print $3 }'",shell=True).decode('ascii').strip()
  port = int(os.environ['VYCMDPORT'])
  with Client((host, port)) as SOCK:
    SOCK.send({'vygdb_getactions':None,'projectname':os.environ['VYPROJECTNAME'],'projecttype':os.environ['VYPROJECTTYPE']})
    data = SOCK.recv()
    if 'BREAKPOINTS' in data:
      VYGDB['BREAKPOINTS'] += data['BREAKPOINTS']
    if 'SCRIPTS' in data:
      vyscripts += data['SCRIPTS']
    marshals_and_methods(vyscripts)

    activate(["proximityc"],True)
    threading.Thread(target=cmd_listener, daemon=True).start()
    gdb.execute("run")
    lastcmd = None
    lastfile = latest_position(SOCK, None)
    while True:
      cmd = get_command()
      if cmd is not None:
        try:
          cmd = lastcmd if len(cmd)==0 and lastcmd is not None else cmd
          gdb.execute( cmd ) #eval(cmd)
          sys.stdout.flush()
          lastcmd = cmd
          lastfile = latest_position(SOCK, lastfile)
        except Exception as exc:
          print('vygdb problem executing ',cmd,exc)
          sys.stdout.flush()


  
