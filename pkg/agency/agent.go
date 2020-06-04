/*
Copyright 2020 Institute for Automation of Complex Power Systems,
E.ON Energy Research Center, RWTH Aachen University

This project is licensed under either of
- Apache License, Version 2.0
- MIT License
at your option.

Apache License, Version 2.0:

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// defines functions necessary for agent execution like message handling,
// context storing and task execution

package agency

import (
	"log"
	"sync"

	"git.rwth-aachen.de/acs/public/cloud/mas/clonemap/pkg/schemas"
	"git.rwth-aachen.de/acs/public/cloud/mas/clonemap/pkg/status"
)

// Agent holds information about an agent and implements functionality for agent execution
type Agent struct {
	mutex    *sync.Mutex
	id       int // unique id of agent
	nodeID   int
	name     string  // Name of agent
	aType    string  // Type of agent
	aSubtype string  // Subtype of agent
	custom   string  // custom data
	masID    int     // ID of MAS agent is belongs to
	status   int     // Status of agent
	ACL      *ACL    // agent communication
	Logger   *Logger // logger object
	MQTT     *MQTT   // mqtt object
	DF       *DF
	logError *log.Logger
	logInfo  *log.Logger
	active   bool
}

// newAgent creates a new agent
func newAgent(info schemas.AgentInfo, msgIn chan schemas.ACLMessage,
	aclLookup func(int) (*ACL, error), log *loggerClient, logConfig schemas.LogConfig,
	mqtt *mqttClient, logErr *log.Logger, logInf *log.Logger) (ag *Agent) {
	ag = &Agent{
		id:       info.ID,
		nodeID:   info.Spec.NodeID,
		name:     info.Spec.Name,
		aType:    info.Spec.AType,
		aSubtype: info.Spec.ASubtype,
		masID:    info.MASID,
		custom:   info.Spec.Custom,
		mutex:    &sync.Mutex{},
		ACL:      newACL(info.ID, msgIn, aclLookup, logErr, logInf),
		logError: logErr,
		logInfo:  logInf,
		active:   true,
	}
	// in, out := ag.ACL.getCommDataChannels()
	ag.Logger = newLogger(ag.id, log, logConfig, ag.logError, ag.logInfo)
	ag.MQTT = newMQTT(ag.id, mqtt, ag.Logger, ag.logError, ag.logInfo)
	ag.DF = newDF(ag.masID, ag.id, ag.nodeID, ag.logError, ag.logInfo)
	return
}

// startAgent starts an agent. It requires an agent task to be executed and the ID of the agent
func (agent *Agent) startAgent(task func(*Agent) error) (err error) {
	go task(agent)
	agent.status = status.Running
	agent.logInfo.Println("Started agent ", agent.GetAgentID())
	return
}

// GetAgentID returns the agent ID
func (agent *Agent) GetAgentID() (ret int) {
	agent.mutex.Lock()
	ret = agent.id
	agent.mutex.Unlock()
	return
}

// GetAgentType returns the agent type and subtype
func (agent *Agent) GetAgentType() (aType string, aSubtype string) {
	agent.mutex.Lock()
	aType = agent.aType
	aSubtype = agent.aSubtype
	agent.mutex.Unlock()
	return
}

// GetAgentName returns the agent name
func (agent *Agent) GetAgentName() (ret string) {
	agent.mutex.Lock()
	ret = agent.name
	agent.mutex.Unlock()
	return
}

// GetCustomData returns custom data
func (agent *Agent) GetCustomData() (ret string) {
	agent.mutex.Lock()
	ret = agent.custom
	agent.mutex.Unlock()
	return
}

// Terminate terminates the agent
func (agent *Agent) Terminate() {
	agent.logInfo.Println("Terminating agent ", agent.GetAgentID())
	agent.mutex.Lock()
	agent.active = false
	agent.mutex.Unlock()
	agent.ACL.close()
	agent.Logger.close()
	agent.MQTT.close()
	agent.DF.close()
}
