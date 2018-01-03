import _ from 'lodash';
import Company from 'common/model/company';
import Certificate from 'common/model/certificate';
import PrivateCompany from 'common/model/privateCompany';
import CompanyTypes from 'common/model/companyTypes';
import CompanyIDs from '1846/config/companyIds';
import TrainIDs from '1846/config/trainIds';
import Train from 'common/model/train';

const PublicCompanyDefinitions = {
    [CompanyIDs.GRAND_TRUNK]: {
        id: CompanyIDs.GRAND_TRUNK,
        type: CompanyTypes.PUBLIC,
        name: 'Grand Trunk',
        nickname: 'GT',
        tokens: 3,
        homeCellId: 'B16'
    },
    [CompanyIDs.NEW_YORK_CENTRAL]: {
        id: CompanyIDs.NEW_YORK_CENTRAL,
        type: CompanyTypes.PUBLIC,
        name: 'New York Central',
        nickname: 'NYC',
        tokens: 4,
        homeCellId: 'D20'
    },
    [CompanyIDs.ERIE]: {
        id: CompanyIDs.ERIE,
        type: CompanyTypes.PUBLIC,
        name: 'Erie',
        nickname: 'Erie',
        tokens: 4,
        homeCellId: 'E21'
    },
    [CompanyIDs.PENNSYLVANIA]: {
        id: CompanyIDs.PENNSYLVANIA,
        type: CompanyTypes.PUBLIC,
        name: 'Pennsylvania',
        nickname: 'PRR',
        tokens: 5,
        homeCellId: 'F20'
    },
    [CompanyIDs.BALTIMORE_OHIO]: {
        id: CompanyIDs.BALTIMORE_OHIO,
        type: CompanyTypes.PUBLIC,
        name: 'Baltimore & Ohio',
        nickname: 'B&O',
        tokens: 4,
        homeCellId: 'G19'
    },
    [CompanyIDs.ILLINOIS_CENTRAL]: {
        id: CompanyIDs.ILLINOIS_CENTRAL,
        type: CompanyTypes.PUBLIC,
        name: 'Illinois Central',
        nickname: 'IC',
        tokens: 4,
        homeCellId: 'K3'
    },
    [CompanyIDs.CHESAPEAKE_OHIO]: {
        id: CompanyIDs.CHESAPEAKE_OHIO,
        type: CompanyTypes.PUBLIC,
        nickname: 'C&O',
        name: 'Chesapeake & Ohio',
        tokens: 4,
        homeCellId: 'I15'
    }
};

const PrivateCompanyDefinitions = {
    [CompanyIDs.MICHIGAN_SOUTHERN]: {
        id: CompanyIDs.MICHIGAN_SOUTHERN,
        name: 'Michigan Southern',
        type: CompanyTypes.INDEPENDANT,
        nickname: 'MS',
        tokens: 1,
        cost: 140,
        maxBuyInPrice: 60,
        trains: [new Train({type:TrainIDs.TRAIN_2})]
    },
    [CompanyIDs.BIG_4]: {
        id: CompanyIDs.BIG_4,
        name: 'Big 4',
        type: CompanyTypes.INDEPENDANT,
        nickname: 'Big 4',
        tokens: 1,
        cost: 100,
        maxBuyInPrice: 40,
        trains: [new Train({type:TrainIDs.TRAIN_2})]
    },
    [CompanyIDs.CHICAGO_WESTERN_INDIANA]: {
        id: CompanyIDs.CHICAGO_WESTERN_INDIANA,
        name: 'Chicago & Western Indiana',
        type: CompanyTypes.PRIVATE,
        cost: 60,
        maxBuyInPrice: 60,
        income: 10,
        hasAbility: true
    },
    [CompanyIDs.OHIO_INDIANA]: {
        id: CompanyIDs.OHIO_INDIANA,
        name: 'Ohio & Indiana',
        type: CompanyTypes.PRIVATE,
        cost: 40,
        maxBuyInPrice: 40,
        income: 15,
        hasAbility: true
    },
    [CompanyIDs.MEAT_PACKING_COMPANY]: {
        id: CompanyIDs.MEAT_PACKING_COMPANY,
        name: 'Meat Packing Company',
        type: CompanyTypes.PRIVATE,
        cost: 60,
        maxBuyInPrice: 60,
        income: 15,
        hasAbility: true
    },
    [CompanyIDs.STEAMBOAT_COMPANY]: {
        id: CompanyIDs.STEAMBOAT_COMPANY,
        name: 'Steamboat Company',
        type: CompanyTypes.PRIVATE,
        cost: 40,
        maxBuyInPrice: 40,
        income: 10,
        hasAbility: true
    },
    [CompanyIDs.LAKE_SHORE_LINE]: {
        id: CompanyIDs.LAKE_SHORE_LINE,
        name: 'Lake Shore Line',
        type: CompanyTypes.PRIVATE,
        cost: 40,
        maxBuyInPrice: 40,
        income: 15,
        hasAbility: true
    },
    [CompanyIDs.MICHIGAN_CENTRAL]: {
        id: CompanyIDs.MICHIGAN_CENTRAL,
        name: 'Michigan Central',
        type: CompanyTypes.PRIVATE,
        cost: 40,
        maxBuyInPrice: 40,
        income: 15,
        hasAbility: true
    },
    [CompanyIDs.MAIL_CONTRACT]: {
        id: CompanyIDs.MAIL_CONTRACT,
        name: 'Mail Contract',
        type: CompanyTypes.PRIVATE,
        cost: 80,
        maxBuyInPrice: 80,
        income: 0
    },
    [CompanyIDs.TUNNEL_BLASTING_COMPANY]: {
        id: CompanyIDs.TUNNEL_BLASTING_COMPANY,
        name: 'Tunnel Blasting Company',
        type: CompanyTypes.PRIVATE,
        cost: 60,
        maxBuyInPrice: 60,
        income: 20
    }

};


class Companies {
    static generatePublicCompanies() {
        return _.map(PublicCompanyDefinitions, (definition) => {
            definition.certificates = _.map(_.range(9), (value) => {
                const certDefinition = {
                    companyId: definition.id,
                    shares: 1
                };
                if (value === 0) {
                    certDefinition.shares += 1;
                    certDefinition.president = true;
                }

                return new Certificate(certDefinition);
            });

            return new Company(definition);
        });
    }

    static generatePrivateCompanies() {
        return _.map(PrivateCompanyDefinitions, (definition) => {
            definition.certificates = [new Certificate({
                                                           companyId: definition.id,
                                                           shares: 1
                                                       })];
            return new PrivateCompany(definition);
        });
    }
}

export default Companies;