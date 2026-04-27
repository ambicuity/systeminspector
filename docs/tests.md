---
description: "Complete SystemInspector documentation and API reference for Tests. Retrieve detailed hardware and system telemetry in Node.js."
---

# Tests

If you run into problems, you now can easily test if a specific function is supported on your platform and returns plausible results. In this section you will learn how you can easily test all functions on your platform:

## Testing on your platform

Install the package in a local test project:

```
npm install @ambicuity/systeminspector
```

Now you can start the test with

```
npm run test
```

You get a nice menu where you now can run function by function and see if you get meaningfull results (if supported on yur platform) or errors. Sample output:

```
╭──────────────────────────────────────────────────────────────────────────────────────────────╮
│ SystemInspector Interactive Terminal v1.0.0                                           ● IDLE │
│ Press a command key to run a check. Press q to quit.                                         │
╰──────────────────────────────────────────────────────────────────────────────────────────────╯

├ Command Palette ─────────────────────────────────────────────────────────────────────────────┤
  Core
  [ t ] time                                    [ y ] System                                  
  [ b ] BIOS                                    [ B ] Baseboard                               
  [ C ] Chassis                                 [ o ] OS Info                                 
  [ S ] Shell                                   [ U ] UUID                                    
  [ z ] Users                                   

  Compute
  [ c ] CPU                                     [ j ] CPU Current Speed                       
  [ T ] CPU Temperature                         [ l ] CPU Current Load                        
  [ L ] Full Load                               [ m ] Memory                                  
  [ M ] MEM Layout                              [ Y ] Battery                                 
  [ g ] Graphics                                

  Storage & Devices
  [ f ] FS Size                                 [ F ] FS Stats                                
  [ E ] Open Files                              [ e ] Block Devices                           
  [ d ] DiskLayout                              [ D ] DiskIO                                  
  [ u ] USB                                     [ a ] Audio                                   
  [ r ] Printer                                 [ h ] Bluetooth                               

  Network
  [ i ] INET Latency                            [ I ] INET Check Site                         
  [ 1 ] NET Iface Default                       [ 2 ] NET Gateway Default                     
  [ 3 ] NET Interfaces                          [ 4 ] NET Stats                               
  [ 5 ] NET Connections                         [ w ] WIFI networks                           
  [ W ] WIFI interfaces                         [ x ] WIFI connections                        

  Processes & Containers
  [ p ] Processes                               [ P ] Process Load                            
  [ s ] Services                                [ v ] Versions                                
  [ V ] Virtual Box                             [ 6 ] Docker Info                             
  [ 7 ] Docker Images                           [ 8 ] Docker Container                        
  [ 9 ] Docker Cont Stats                       [ 0 ] Docker Cont Proc                        
  [ + ] Docker Volumes                          

  Aggregate
  [ ? ] Get Object                              [ , ] All Static                              
  [ . ] All Dynamic                             [ / ] All                                     
  [ q ] Quit                                    

  • Commands run one at a time. Results stay in scrollback for review.
├──────────────────────────────────────────────────────────────────────────────────────────────┤

╭──────────────────────────────────────────────────────────────────────────────────────────────╮
│ No command has run yet.                                                                      │
│ Choose a key from the palette above to inspect this machine.                                 │
│ Try [ t ] for time, [ m ] for memory, or [ 5 ] for network connections.                      │
│ Use [ ? ] for a custom object, and [ q ] to quit.                                            │
╰──────────────────────────────────────────────────────────────────────────────────────────────╯
```

Press q to exit the test suite

Here a sample output for the e.g. c ... CPU

```
╭──────────────────────────────────────────────────────────────────────────────╮
│ CPU v1.0.0                                                           ● READY │
│ Command [ c ] CPU   Time to complete 24ms                                    │
╰──────────────────────────────────────────────────────────────────────────────╯
╭──────────────────────────────────────────────────────────────────────────────╮
│ {
│   manufacturer: 'Apple',
│   brand: 'M2',
│   vendor: 'Apple',
│   family: '-634136515',
│   model: '',
│   stepping: '2',
│   revision: '',
│   voltage: '',
│   speed: 2.4,
│   speedMin: 2.4,
│   speedMax: 2.4,
│   governor: '',
│   cores: 8,
│   physicalCores: 8,
│   performanceCores: 4,
│   efficiencyCores: 4,
│   processors: 1,
│   socket: 'SOC',
│   flags: '',
│   virtualization: true,
│   cache: { l1d: 131072, l1i: 65536, l2: 4194304, l3: null }
│ }
╰──────────────────────────────────────────────────────────────────────────────╯
```

Make sure to have a look in the documentation if there are already [known issues](issues.html) and if the specific function is supported on your platform. If yes, check whether results are meaningfull and plausible.

I highly appreciate if you test all functions on your specific platform. This will help me improving the package and provide the best possible platform support.