import time, sys, os, shutil, json, math, subprocess, copy, re
'''
nt_ = thing_db.meteordb.bmsetup.find_one({'name':'NativeTypes'})
NATIVE_TYPES = [nt['value'] for nt in nt_['data']['types']]
del nt_

def camel_to_snake(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
    
def dependency_text(referenced):
    builddep = '\n'
    execdep = '\n'
    pkglist = '\n'
    allref = ''
    refs = copy.copy(referenced['widgets'])
    refs.extend(referenced['signals'])
    for ref in refs:
      builddep += '  <build_depend>'+ref+'</build_depend>\n';
      execdep += '  <exec_depend>'+ref+'</exec_depend>\n';
      pkglist += 'find_package('+ref+' REQUIRED)\n';
      allref += '"' + ref + '" ';
    return (allref, builddep, execdep, pkglist)
    
def setup_cppwidget(builddata):
  allref, builddep, execdep, pkglist = dependency_text(builddata['referenced'])
  filedep = ''
  headerfiles = ''
  if len(builddata['referenced']['files']) > 0:
    filedep = 'SET(filesources ' + ' '.join(['"'+f+'"' for f in builddata['referenced']['files']]) + ')';
    for f in builddata['referenced']['files']:
      if f.endswith('.hpp') or f.endswith('.h'):
        headerfiles += '"'+f+'" '
  if len(headerfiles)>0:
    headerfiles = '\n  SET(headerfiles '+headerfiles+')\n';
    headerfiles += '  INSTALL(FILES ${headerfiles} DESTINATION include/'+builddata['project']+')\n';
    
  cmakelists = 'CMAKE_MINIMUM_REQUIRED(VERSION 3.5)\n' + \
    'MESSAGE( STATUS "CMAKE_INSTALL_PREFIX is: " ${CMAKE_INSTALL_PREFIX} )\n' + \
    'PROJECT('+builddata['project']+')\n' + builddata['nm']['src'] + filedep + \
    '\n' + \
    'SET(project '+builddata['project']+')\n' + \
    '  MESSAGE( STATUS "PROJECT:         " ${project}${target_suffix} )\n' + \
    'if(NOT WIN32)\n' + \
    '  SET( CMAKE_CXX_FLAGS  "${CMAKE_CXX_FLAGS} -fPIC -Wno-unused-value -Wno-unused-result -DNDEBUG -g -fwrapv -O3 -Wall -Wextra -std=c++11" )\n' + \
    '  SET( CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -fPIC -Wno-unused-value -Wno-unused-result -g -fwrapv -O3 -Wall -Wextra -std=c++11" )\n' + \
    builddata['nm']['linux'] +  \
    'endif()\n' + \
    '\n' + \
    'find_package(ament_cmake REQUIRED)\n' + \
    'find_package(rclcpp REQUIRED)\n' + \
    'find_package(rcutils)\n' + \
    'find_package(rmw REQUIRED)\n' + \
    'find_package(rmw_implementation_cmake REQUIRED)\n' + \
    'find_package(std_msgs REQUIRED)\n' + \
    pkglist + '\n' + \
    '\n' + \
    builddata['nm']['include'] +  \
    'set(fulltarget "${project}${target_suffix}")\n' + \
    builddata['exe'] + \
    'ament_target_dependencies(${fulltarget}\n' + \
    '  "rclcpp${target_suffix}"\n' + \
    '  "rcutils${target_suffix}"\n' + \
    '  "std_msgs${target_suffix}"\n  '+ allref +')\n' + \
    'install(TARGETS ${fulltarget} DESTINATION bin)\n' + \
    headerfiles + \
    '#call_for_each_rmw_implementation(targets GENERATE_DEFAULT)\n' + \
    'ament_package()\n';

  packagexml = '<?xml version="1.0"?>\n' + \
    '<?xml-model href="http://download.ros.org/schema/package_format2.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>\n' + \
    '<package format="3">\n' + \
    '  <name>'+builddata['project']+'</name>\n' + \
    '  <version>0.0.0</version>\n' + \
    '  <description>'+builddata['summary']+'</description>\n' + \
    '  <author email="'+builddata['email']+'">'+builddata['ownername']+'</author>\n' + \
    '  <maintainer email="'+builddata['email']+'">'+builddata['ownername']+'</maintainer>\n' + \
    '  <license>'+builddata['license']+'</license>\n' + \
    '\n' + \
    '  <buildtool_depend>ament_cmake</buildtool_depend>\n' + \
    '  <buildtool_depend>rosidl_default_generators</buildtool_depend>\n' +  \
    '\n' + \
    '  <build_depend>rclcpp</build_depend>\n' + \
    '  <build_depend>rmw_implementation</build_depend>\n' + \
    '  <build_depend>rmw_implementation_cmake</build_depend>\n' + builddep + \
    '\n' + \
    '  <exec_depend>rclcpp</exec_depend>\n' + \
    '  <exec_depend>rmw_implementation</exec_depend>\n' + \
    '  <exec_depend>rosidl_default_runtime</exec_depend>\n' + execdep + \
    '\n' + \
    '  <test_depend>ament_cmake_nose</test_depend>\n' + \
    '  <test_depend>ament_lint_auto</test_depend>\n' + \
    '  <test_depend>ament_lint_common</test_depend>\n' + \
    '  <test_depend>launch</test_depend>\n' + \
    '  <test_depend>launch_testing</test_depend>\n' + \
    '  <test_depend>rclcpp</test_depend>\n' + \
    '  <test_depend>rmw_implementation</test_depend>\n' + \
    '  <test_depend>rosidl_default_generators</test_depend>\n' + \
    '  <test_depend>rosidl_default_runtime</test_depend>\n' + \
    '\n' + \
    '  <export>\n' + \
    '    <build_type>ament_cmake</build_type>\n' + \
    '  </export>\n' + \
    '</package>\n';
  return (cmakelists,packagexml)

def setup_pythonwidget(builddata):

  pym = [f.replace('.py','').replace('/','.') for f in builddata['referenced']['files']]
  entryfile = pym[0];  # Assume the entry file is the first one?? 
  pymods = ','.join(["'"+f+"'" for f in pym])
  allref, builddep, execdep, pkglist = dependency_text(builddata['referenced'])
  
  setupfile = "from setuptools import setup\n\n" + \
          "setup(\n" + \
          "    name='"+builddata['project']+"',\n" + \
          "    version='0.0.0',\n" + \
          "    packages=[],\n" + \
          "    py_modules=["+pymods+"],\n" + \
          "    install_requires=['setuptools'],\n" + \
          "    author='"+builddata['ownername']+"',\n" + \
          "    author_email='"+builddata['email']+"',\n" + \
          "    maintainer='"+builddata['ownername']+"',\n" + \
          "    maintainer_email='"+builddata['email']+"',\n" + \
          "    zip_safe=True,\n" + \
          "    keywords=['ROS2'],\n" + \
          "    classifiers=[],\n" + \
          "    description=('" + builddata['summary'] + "'),\n" + \
          "    license='"+builddata['license']+"',\n" + \
          "    entry_points={'console_scripts': ['"+builddata['project']+" = "+entryfile+":main']},\n" + \
          ")\n"
          
  packagexml = '<?xml version="1.0"?>\n' + \
    '<?xml-model href="http://download.ros.org/schema/package_format2.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>\n' + \
    '<package format="3">\n' + \
    '  <name>'+builddata['project']+'</name>\n' + \
    '  <version>0.0.0</version>\n' + \
    '  <description>'+builddata['summary']+'</description>\n' + \
    '  <author email="'+builddata['email']+'">'+builddata['ownername']+'</author>\n' + \
    '  <maintainer email="'+builddata['email']+'">'+builddata['ownername']+'</maintainer>\n' + \
    '  <license>'+builddata['license']+'</license>\n' + \
    '\n' + \
    '  <exec_depend>example_interfaces</exec_depend>\n' + \
    '  <exec_depend>rclpy</exec_depend>\n' + execdep + \
    '  <exec_depend>std_msgs</exec_depend>\n' + \
    '\n' + \
    '  <test_depend>ament_copyright</test_depend>\n' + \
    '  <test_depend>ament_pep257</test_depend>\n' + \
    '  <test_depend>ament_pep8</test_depend>\n' + \
    '  <test_depend>ament_pyflakes</test_depend>\n' + \
    '\n' + \
    '  <export>\n' + \
    '    <build_type>ament_python</build_type>\n' + \
    '  </export>\n' + \
    '</package>\n';
          
  return (setupfile, packagexml)

def build_widget(widgetid,srcpath):
  builddata = {'id':widgetid}
  widget = thing_db.meteordb.widgets.find_one(widgetid)
  user = thing_db.meteordb.users.find_one(widget['#meta']['#owner']);
  builddata['license'] = 'Apache License, Version 2.0' 
  builddata['email'] = 'fake@fake.fake';
  builddata['owner'] = widget['#meta']['#owner'];
  builddata['ownername'] = user['username']
  builddata['summary'] = widget['summary'];
  builddata['project'] = thing_db.project_name(widget);
  path = os.path.join(srcpath , builddata['project'])
  
  builddata['referenced'] = {'widgets':[],'signals':[],'files':[]};
  
  for refwidget in widget['widget']:
    wid = thing_db.meteordb.widgets.find_one(refwidget['#widgetid']);
    refwidgetdep = thing_db.project_name(wid);
    if refwidgetdep not in builddata['referenced']['widgets']:
      builddata['referenced']['widgets'].append(refwidgetdep)

  for signal in widget['signal']:
    sigdep = '';
    sig = thing_db.meteordb.signals.find_one(signal['#signalid']);
    if sig is not None:
      sigdep = thing_db.project_name(sig);
    if sigdep not in builddata['referenced']['signals']:
      builddata['referenced']['signals'].append(sigdep);
  
  typ = {'cpp':False,'python':False}
  for f in widget['file']:
    cpptype = any([f['name'].endswith(ext) for ext in ['.cpp','.hpp','.h','.c']])
    pytype = any([f['name'].endswith(ext) for ext in ['.py']])
    typ['cpp'] = typ['cpp'] or cpptype
    typ['python'] = typ['python'] or pytype
    fpath = os.path.join(path,f['name']);
    txt = thing_db.meteordb.files.find_one(f['#fileid'])['text']
    filetyp = 'cpp' if cpptype else ('python' if pytype else 'null')

    thing_db.WriteToFileDir(fpath,txt)
    builddata['referenced']['files'].append(f['name']);
  

  builddata['nm'] = {}
  builddata['nm']['linux'] = ''
  builddata['nm']['include'] = ''
  builddata['exe'] = ''
  builddata['nm']['src'] = '' if 'cmakedef' not in widget else '\n'.join(widget['cmakedef'].split('\\n'))

  if 'library' in widget['buildtype']:
    builddata['exe'] = '  ADD_LIBRARY(${fulltarget} ${filesources} ${sources} )\n';
    builddata['nm']['include'] = '  INCLUDE_DIRECTORIES ("${project}${target_suffix}" ${includes})\n';
    if widget['buildtype']=='dynamiclibrary':
      builddata['nm']['linux']  = '  SET( CMAKE_EXE_LINKER_FLAGS  "${CMAKE_EXE_LINKER_FLAGS} -shared" )\n'
      builddata['nm']['linux'] += '  SET(BUILD_SHARED_LIBS ON)\n'
  elif widget['buildtype']=='executable':
    builddata['exe'] = '  ADD_EXECUTABLE(${fulltarget} ${filesources} ${sources})\n';
  else:
    print("Widget "+widget['name']+" does not have buildtype 'staticlibrary', 'dynamiclibrary', or 'executable' and so cannot be built.")
    return None

  #builddata['nm']['src'] = 'SET(nmdir "'+thing_db.nmengine_path+'/nmengine")\n' + \
  #  'SET(sources "${nmdir}/src/nmbindings.h" "${nmdir}/src/nmwidgets.h" "${nmdir}/bin/nmwidgets.o" "${nmdir}/bin/nmbindings.o")\n';
  #builddata['nm']['include'] = '  INCLUDE_DIRECTORIES ("${project}${target_suffix}" "${nmdir}/bin" "${nmdir}/src")\n';

  if typ['cpp']:
    cmakelists,packagexml = setup_cppwidget(builddata)
    if not os.path.exists(os.path.join(path,'CMakeLists.txt')):
      thing_db.WriteToFileDir(os.path.join(path,'CMakeLists.txt') , cmakelists)
      print('\n//--CMakeLists.txt-----------------------------------------------------------------------------\n')
      print(cmakelists)
      print('\n//--------------------------------------------------------------------------------\n')
    if not os.path.exists(os.path.join(path,'package.xml')):
      thing_db.WriteToFileDir(os.path.join(path,'package.xml') , packagexml)
  elif typ['python']:
    setupfile,packagexml = setup_pythonwidget(builddata)
    thing_db.WriteToFileDir(os.path.join(path,'setup.py') , setupfile)
    print('\n//--setup.py-----------------------------------------------------------------------------\n')
    print(setupfile)
    print('\n//--------------------------------------------------------------------------------\n')
    thing_db.WriteToFileDir(os.path.join(path,'package.xml') , packagexml)
  else:
    builddata['dontbuild'] = True
  return builddata

def build_signal(signals,signal,srcpath):
  
  email = 'fake@fake.fake';
  owner = 'fake';
  summary = 'NA'; #signal['summary'].replace(/\</g, '').replace(/\>/g, '');
  
  builddeplist = '\n'
  execdeplist = '\n'
  pkglist = '\n'
  pkgdep = ''
  msgtext = '# '+summary + '\n'
  sigdeps = []
  for el in signal['element']:
    sigdep = '';
    elementdir = '';
    sig = el['#signalid']);
    if sig is None:
      # Assume native type
      sigdep = 'std_msgs';
      elementdir = el['#signalid'];
    else:
      sigdep = thing_db.project_name(sig);
      elementdir = sigdep + '/' + sig['name'].split(':')[-1];
    
    elen = ('[]' if el['length']==0 else '['+str(el['length'])+']') if 'length' in el else ''
    elval = '' if 'value' not in el else '=' + str(el['value'])
    msgtext += elementdir + elen + ' ' + el['name'] + elval + '\n';
    
    if sigdep not in sigdeps:
      sigdeps.append(sigdep);
      builddeplist += '  <build_depend>'+sigdep+'</build_depend>\n';
      execdeplist += '  <exec_depend>'+sigdep+'</exec_depend>\n';
      pkglist += 'find_package('+sigdep+' REQUIRED)\n';
      pkgdep += ' '+sigdep+' ';
  
  messagename = signal['name'].split(':')[-1] + '.msg';


  packagexml = '<?xml version="1.0"?>\n' + \
    '<?xml-model href="http://download.ros.org/schema/package_format2.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>\n' + \
    '<package format="3">\n' + \
    '  <name>'+sproject+'</name>\n' + \
    '  <version>0.0.0</version>\n' + \
    '  <description>'+summary+'</description>\n' + \
    '  <maintainer email="'+email+'">'+ownername+'</maintainer>\n' + \
    '  <license>Apache License 2.0</license>\n' + \
    '\n' + \
    '  <member_of_group>rosidl_interface_packages</member_of_group>' +\
    '\n' + \
    '  <buildtool_depend>ament_cmake</buildtool_depend>\n' + \
    '  <buildtool_depend>rosidl_default_generators</buildtool_depend>\n' +  \
    '\n' + \
    '  <build_depend>builtin_interfaces</build_depend>\n' + builddeplist +  \
    '\n' + \
    '  <exec_depend>builtin_interfaces</exec_depend>\n' + \
    '  <exec_depend>rosidl_default_runtime</exec_depend>\n' + execdeplist + \
    '\n' + \
    '  <test_depend>ament_cmake_nose</test_depend>\n' + \
    '  <test_depend>ament_lint_auto</test_depend>\n' + \
    '  <test_depend>ament_lint_common</test_depend>\n' + \
    '  <test_depend>launch</test_depend>\n' + \
    '  <test_depend>launch_testing</test_depend>\n' + \
    '  <test_depend>rclcpp</test_depend>\n' + \
    '  <test_depend>rmw_implementation</test_depend>\n' + \
    '  <test_depend>rosidl_default_generators</test_depend>\n' + \
    '  <test_depend>rosidl_default_runtime</test_depend>\n' + \
    '\n' + \
    '  <export>\n' + \
    '    <build_type>ament_cmake</build_type>\n' + \
    '  </export>\n' + \
    '</package>\n';
  
  cmakelists = 'cmake_minimum_required(VERSION 3.5)\n' + \
    'MESSAGE( STATUS "CMAKE_INSTALL_PREFIX is: " ${CMAKE_INSTALL_PREFIX} )\n' + \
    '\n' + \
    'project('+sproject+')\n' + \
    '\n' + \
    'if(NOT WIN32)\n' + \
    '  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11 -Wall -Wextra")\n' + \
    'endif()\n' + \
    '\n' + \
    'find_package(ament_cmake REQUIRED)\n' + \
    'find_package(builtin_interfaces REQUIRED)\n' + \
    pkglist + \
    'find_package(rosidl_default_generators REQUIRED)\n' + \
    '\n' + \
    'rosidl_generate_interfaces(${PROJECT_NAME} "msg/'+messagename+'" DEPENDENCIES '+pkgdep+' builtin_interfaces)\n' +  \
    '\n' + \
    'ament_package()\n';
 
  path = os.path.join(srcpath , sproject)
  print('//--MSG------------------------------------------------------------------------------\n')
  print(msgtext)
  print('\n//--CMakeLists.txt-----------------------------------------------------------------------------\n')
  print(cmakelists)
  print('\n//--------------------------------------------------------------------------------\n')
  thing_db.WriteToFileDir(os.path.join(path,'msg/'+messagename) , msgtext)
  thing_db.WriteToFileDir(os.path.join(path,'package.xml'), packagexml)
  thing_db.WriteToFileDir(os.path.join(path,'CMakeLists.txt') ,cmakelists)
  return {'project':sproject,'owner':owner,'ownername':ownername,'id':signalid}


'''

if __name__ == '__main__':
  if len(sys.argv)>1:
    root = sys.argv[1]
    for x in os.listdir(root):
      mpath = os.path.join(root,x)
      print(mpath)
      with open(mpath,'r') as r:
        y = json.loads(r.read())
        print(y)

