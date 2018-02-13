import ko from 'knockout';
import _ from 'lodash';
import ValidationError from 'common/game/validationError';
import Serializable from 'common/model/serializable';
import PhaseIDs from '1846/config/phaseIds';
import TrainIDs from '1846/config/trainIds';

class Bank extends Serializable {
    constructor(definition) {
        definition = definition || {};
        super(definition);
        this.cash = ko.observable(definition.cash || 0);
        this.trainsByPhase = ko.observable(definition.trainsByPhase || {});
        this.certificates = ko.observableArray(definition.certificates || []);
        this.certificatesById = ko.computed(() => {
            return _.groupBy(this.certificates(), 'companyId');
        });
    }

    getTrainsForPhase(phase) {
        if(phase === PhaseIDs.PHASE_I ) {
            return [TrainIDs.TRAIN_2];
        }
        else if(phase === PhaseIDs.PHASE_II) {
            return [TrainIDs.TRAIN_3_5, TrainIDs.TRAIN_4];
        }
        else if(phase === PhaseIDs.PHASE_III) {
            return [TrainIDs.TRAIN_4_6, TrainIDs.TRAIN_5];
        }
        else if(phase === PhaseIDs.PHASE_IV) {
            return [TrainIDs.TRAIN_6, TrainIDs.TRAIN_7_8];
        }
    }

    getAvailableTrainsForPhase(phase) {
        return phase === PhaseIDs.PHASE_IV ? 99 : this.trainsByPhase()[phase];
    }

    removeTrains(type, count) {
        this.trainsByPhase.valueWillMutate();
        if(type === TrainIDs.TRAIN_2) {
            this.trainsByPhase()[PhaseIDs.PHASE_I] -= count || 1;
        }
        else if(type === TrainIDs.TRAIN_3_5 || type === TrainIDs.TRAIN_4) {
            this.trainsByPhase()[PhaseIDs.PHASE_II] -= count || 1;
        }
        else if(type === TrainIDs.TRAIN_4_6 || type === TrainIDs.TRAIN_5) {
            this.trainsByPhase()[PhaseIDs.PHASE_III] -= count || 1;
        }
        this.trainsByPhase.valueHasMutated();
    }

    addTrains(type, count) {
        this.trainsByPhase.valueWillMutate();
        if(type === TrainIDs.TRAIN_2) {
            this.trainsByPhase()[PhaseIDs.PHASE_I] += count || 1;
        }
        else if(type === TrainIDs.TRAIN_3_5 || type === TrainIDs.TRAIN_4) {
            this.trainsByPhase()[PhaseIDs.PHASE_II] += count || 1;
        }
        else if(type === TrainIDs.TRAIN_4_6 || type === TrainIDs.TRAIN_5) {
            this.trainsByPhase()[PhaseIDs.PHASE_III] += count || 1;
        }
        this.trainsByPhase.valueHasMutated();
    }

    cheapestCostForTrainPhase(phaseId) {
        if(phaseId === PhaseIDs.PHASE_I) {
            return 80;
        }
        else if (phaseId === PhaseIDs.PHASE_II) {
            return 160;
        }
        else if (phaseId === PhaseIDs.PHASE_III) {
            return 450;
        }
        else if (phaseId === PhaseIDs.PHASE_IV) {
            return 800;
        }
    }

    getCheapestTrainCost() {
        return _(PhaseIDs).values().map(phaseId => {
            const trains = this.trainsByPhase()[phaseId];
            if(trains > 0 || trains === -1) {
                return this.cheapestCostForTrainPhase(phaseId);
            }
            return null;
        }).compact().min();
    }

    getFirstAvailablePhaseTrains() {
        const phase =  _(PhaseIDs).values().find(phaseId => {
            const trains = this.trainsByPhase()[phaseId];
            return trains > 0 || trains === -1;
        });
        return this.getTrainsForPhase(phase);
    }

    addCash(amount) {
        this.cash(this.cash() + amount);
    }

    removeCash(amount) {
        this.cash(this.cash() - amount);
    }

    addCerts(certs) {
        this.certificates.push.apply(this.certificates, certs);
    }

    removeCert(companyId) {
        const certs = this.certificates();
        const indexToRemove = _.findIndex(certs, {companyId});
        if(indexToRemove < 0) {
            throw ValidationError('Cert to remove from bank not found!');
        }
        const removedCert = _.pullAt(certs, indexToRemove)[0];
        this.certificates(certs);
        return removedCert;
    }

    numSharesOwnedOfCompany(companyId) {
        return _(this.certificatesById()[companyId] || []).sumBy('shares');
    }

    removeNonPresidentCertsForCompany(count, companyId) {
        const certIdsToRemove = _(this.certificatesById()[companyId]).sortBy('president').reverse().take(count).map('id').value();
        return this.certificates.remove(cert=>{
            return _.indexOf(certIdsToRemove, cert.id) >= 0;
        });
    }

    removeAllCertsForCompany(companyId) {
        return this.certificates.remove(cert=> {
            return cert.companyId === companyId;
        });
    }
}

Bank.registerClass();

export default Bank;